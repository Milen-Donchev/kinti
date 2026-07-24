import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import type { RequestWithId } from './observability/request-id.middleware';

type ClientErrorBody = {
  message: string | string[];
  error: string;
  statusCode: number;
  code: string;
  requestId?: string;
};

type ErrorLogContext = {
  requestId?: string;
  method?: string;
  path?: string;
  statusCode: number;
  errorName: string;
};

@Catch(HttpException)
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const statusCode = exception.getStatus();
    const clientError = this.getClientError(exception, statusCode, request);

    this.logError(exception, request, statusCode);

    return response.status(statusCode).json(clientError);
  }

  private getClientError(
    exception: HttpException,
    statusCode: number,
    request: RequestWithId,
  ): ClientErrorBody {
    const response = exception.getResponse();

    if (typeof response === 'object' && response !== null) {
      const body = response as Partial<ClientErrorBody>;

      return {
        message: body.message ?? exception.message,
        error: body.error ?? exception.name,
        statusCode,
        code: body.code ?? 'HTTP_ERROR',
        requestId: request.requestId,
      };
    }

    return {
      message: exception.message,
      error: exception.name,
      statusCode,
      code: 'HTTP_ERROR',
      requestId: request.requestId,
    };
  }

  private logError(
    exception: HttpException,
    request: RequestWithId,
    statusCode: number,
  ) {
    const context: ErrorLogContext = {
      requestId: request.requestId,
      method: request.method,
      path: request.path || request.originalUrl?.split('?')[0] || request.url,
      statusCode,
      errorName: exception.name,
    };

    if (statusCode >= 500) {
      this.logger.error(
        `Unhandled error while handling ${context.method ?? 'UNKNOWN'} ${context.path ?? 'UNKNOWN'}`,
        exception instanceof Error ? exception.stack : undefined,
        JSON.stringify(context),
      );
      return;
    }

    this.logger.warn(
      `Handled error while handling ${context.method ?? 'UNKNOWN'} ${context.path ?? 'UNKNOWN'}`,
      JSON.stringify(context),
    );
  }
}
