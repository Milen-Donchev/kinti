import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from './types';

@Injectable()
export class AuthService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');

    this.issuer = this.configService.getOrThrow<string>('SUPABASE_JWT_ISSUER');

    this.jwks = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
    );
  }

  async verifyAccessToken(accessToken: string): Promise<AuthUser> {
    try {
      const { payload } = await jwtVerify(accessToken, this.jwks, {
        issuer: this.issuer,
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Missing token subject');
      }

      return {
        id: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
      };
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async getCurrentProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        id: userId,
      },
      include: {
        settings: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }
}
