import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { UserSettingsService } from './user-settings.service';
import { UpsertUserSettingsDto } from './dto/upsert-user-settings.dto';

import type { AuthUser } from '../auth/types';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('user-settings')
@UseGuards(AuthGuard)
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @Get()
  async getUserSettings(@CurrentUser() user: AuthUser) {
    return await this.userSettingsService.getUserSettings(user.id);
  }

  @Patch()
  async updateUserSettings(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertUserSettingsDto,
  ) {
    return await this.userSettingsService.updateUserSettings(user.id, dto);
  }
}
