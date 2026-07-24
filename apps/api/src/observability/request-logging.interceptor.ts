import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { catchError, tap, throwError } from 'rxjs';

import type { RequestWithId } from './request-id.middleware';

type RequestLogContext = {
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs: number;
};

function getSlowRequestThresholdMs() {
  const rawValue = Number(process.env.SLOW_REQUEST_MS);

  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return 500;
  }

  return rawValue;
}

function getRequestPath(request: Request) {
  return request.path || request.originalUrl?.split('?')[0] || request.url;
}

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);
  private readonly slowRequestThresholdMs = getSlowRequestThresholdMs();

  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const startedAt = performance.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Math.round(performance.now() - startedAt);
        const logContext: RequestLogContext = {
          requestId: request.requestId,
          method: request.method,
          path: getRequestPath(request),
          statusCode: response.statusCode,
          durationMs,
        };

        if (durationMs >= this.slowRequestThresholdMs) {
          this.logger.warn(
            `Slow request ${logContext.method ?? 'UNKNOWN'} ${logContext.path ?? 'UNKNOWN'} completed in ${durationMs}ms`,
            JSON.stringify(logContext),
          );
          return;
        }

        this.logger.log(
          `Request ${logContext.method ?? 'UNKNOWN'} ${logContext.path ?? 'UNKNOWN'} completed in ${durationMs}ms`,
          JSON.stringify(logContext),
        );
      }),
      catchError((error: unknown) => {
        const durationMs = Math.round(performance.now() - startedAt);
        const logContext: RequestLogContext = {
          requestId: request.requestId,
          method: request.method,
          path: getRequestPath(request),
          statusCode: response.statusCode,
          durationMs,
        };

        this.logger.warn(
          `Request ${logContext.method ?? 'UNKNOWN'} ${logContext.path ?? 'UNKNOWN'} failed in ${durationMs}ms`,
          JSON.stringify(logContext),
        );

        return throwError(() => error);
      }),
    );
  }
}
