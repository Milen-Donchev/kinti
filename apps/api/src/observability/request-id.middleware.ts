import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

export type RequestWithId = Request & {
  requestId?: string;
};

export function requestIdMiddleware(
  request: RequestWithId,
  response: Response,
  next: NextFunction,
) {
  const headerValue = request.header(REQUEST_ID_HEADER);
  const requestId = headerValue?.trim() || randomUUID();

  request.requestId = requestId;
  response.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}
