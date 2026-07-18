import type { Request } from 'express';

export type AuthUser = {
  id: string;
  email?: string;
};

export type RequestWithUser = Request & {
  user: AuthUser;
};
