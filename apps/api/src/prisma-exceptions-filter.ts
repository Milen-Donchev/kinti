import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

import type { RequestWithId } from './observability/request-id.middleware';

type ClientErrorBody = {
  message: string;
  error: string;
  statusCode: number;
  code: string;
  requestId?: string;
};

type PrismaErrorLogContext = {
  requestId?: string;
  errorName: string;
  method?: string;
  path?: string;
  prismaCode?: string;
  clientVersion?: string;
  meta?: unknown;
  message: string;
};

function redactSensitiveText(value: string) {
  return value
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, 'postgresql://[redacted]@')
    .replace(/(password=)[^&\s]+/gi, '$1[redacted]');
}

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientRustPanicError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientValidationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const clientError = this.getClientError(exception);
    clientError.requestId = request.requestId;

    this.logPrismaError(exception, {
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl || request.url,
    });

    return response.status(clientError.statusCode).json(clientError);
  }

  private getClientError(exception: Error): ClientErrorBody {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return {
            message: 'Resource already exists',
            error: 'Conflict',
            statusCode: HttpStatus.CONFLICT,
            code: 'DATABASE_CONFLICT',
          };

        case 'P2025':
          return {
            message: 'Record not found',
            error: 'Not Found',
            statusCode: HttpStatus.NOT_FOUND,
            code: 'DATABASE_RECORD_NOT_FOUND',
          };

        case 'P2007':
          return {
            message: 'Invalid request format',
            error: 'Bad Request',
            statusCode: HttpStatus.BAD_REQUEST,
            code: 'DATABASE_INVALID_DATA',
          };
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        message: 'Invalid database query',
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'DATABASE_QUERY_VALIDATION_ERROR',
      };
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return {
        message: 'Database connection is not available',
        error: 'Service Unavailable',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'DATABASE_CONNECTION_UNAVAILABLE',
      };
    }

    return {
      message: 'Unexpected database error',
      error: 'Internal Server Error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'DATABASE_ERROR',
    };
  }

  private logPrismaError(
    exception: Error,
    requestContext: Pick<
      PrismaErrorLogContext,
      'method' | 'path' | 'requestId'
    >,
  ) {
    const context: PrismaErrorLogContext = {
      ...requestContext,
      errorName: exception.name,
      message: redactSensitiveText(exception.message),
    };

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      context.prismaCode = exception.code;
      context.clientVersion = exception.clientVersion;
      context.meta = exception.meta;
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      context.clientVersion = exception.clientVersion;
    }

    this.logger.error(
      `Prisma error while handling ${context.method ?? 'UNKNOWN'} ${context.path ?? 'UNKNOWN'}`,
      JSON.stringify(context),
    );
  }
}
