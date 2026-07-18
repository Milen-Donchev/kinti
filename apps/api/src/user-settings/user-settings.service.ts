import { Injectable } from '@nestjs/common';
import { Currency, Language, Theme, UserSettings } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpsertUserSettingsDto } from './dto/upsert-user-settings.dto';

const DEFAULT_SETTINGS: Pick<UserSettings, 'currency' | 'language' | 'theme'> =
  {
    language: Language.bg,
    currency: Currency.eur,
    theme: Theme.system,
  };

@Injectable()
export class UserSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserSettings(userId: string) {
    const userSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!userSettings) {
      return await this.prisma.userSettings.create({
        data: {
          userId,
          ...DEFAULT_SETTINGS,
        },
      });
    }

    return userSettings;
  }

  async updateUserSettings(userId: string, dto: UpsertUserSettingsDto) {
    return await this.prisma.userSettings.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        ...DEFAULT_SETTINGS,
        ...dto,
      },
      update: {
        ...dto,
      },
    });
  }
}
