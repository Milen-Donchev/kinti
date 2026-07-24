import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import type { AuthUser } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: AuthUser) {
    const profile = await this.authService.getCurrentProfile(user.id);

    return {
      user,
      profile,
    };
  }
}
