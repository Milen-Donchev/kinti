import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientRustPanicError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientValidationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return response.status(409).json({
            message: 'Resource already exists',
          });

        case 'P2025':
          return response.status(404).json({
            message: 'Record not found',
          });

        case 'P2007':
          return response.status(400).json({
            message: 'Invalid request format',
          });
      }
    }

    return response.status(500).json({
      message: 'Database error: ' + exception.name,
    });
  }
}
