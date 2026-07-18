import { Currency, Language, Theme } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpsertUserSettingsDto {
  @IsEnum(Language)
  @IsOptional()
  language: Language;

  @IsEnum(Theme)
  @IsOptional()
  theme: Theme;

  @IsEnum(Currency)
  @IsOptional()
  currency: Currency;
}
