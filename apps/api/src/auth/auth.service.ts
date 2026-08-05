import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
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
  private readonly supabaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');

    this.issuer = this.configService.getOrThrow<string>('SUPABASE_JWT_ISSUER');

    this.jwks = createRemoteJWKSet(
      new URL(`${this.supabaseUrl}/auth/v1/.well-known/jwks.json`),
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

  async deleteAccount(userId: string) {
    await this.deleteSupabaseAuthUser(userId);

    await this.prisma.profile.deleteMany({
      where: {
        id: userId,
      },
    });
  }

  private async deleteSupabaseAuthUser(userId: string) {
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!serviceRoleKey) {
      throw new ServiceUnavailableException(
        'Account deletion is not configured',
      );
    }

    const response = await fetch(
      `${this.supabaseUrl}/auth/v1/admin/users/${userId}`,
      {
        method: 'DELETE',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Unable to delete account right now',
      );
    }
  }
}
