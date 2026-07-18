import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import type { AuthUser } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: AuthUser) {
    const profile = await this.authService.getCurrentProfile(user.id);

    return {
      user,
      profile,
    };
  }
}
