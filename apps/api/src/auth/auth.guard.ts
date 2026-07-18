import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import type { RequestWithUser } from './types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const accessToken = authHeader.slice('Bearer '.length);
    const user = await this.authService.verifyAccessToken(accessToken);

    (request as RequestWithUser).user = user;

    return true;
  }
}
