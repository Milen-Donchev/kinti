import {
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BillingPeriod, ExpenseType, Importance } from '@prisma/client';

const DEFAULT_AMOUNT_REGEX = /^\d{1,8}(\.\d{1,2})?$/;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateExpenseDto {
  @IsString()
  @MaxLength(255)
  @MinLength(1)
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsDecimal({
    decimal_digits: '1,2',
    force_decimal: false,
  })
  @Matches(DEFAULT_AMOUNT_REGEX, {
    message:
      'defaultAmount must be at most 8 digits before the decimal and 2 after',
  })
  defaultAmount: string;

  @IsNotEmpty()
  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @IsString()
  @IsNotEmpty()
  @Matches(DATE_ONLY_REGEX, {
    message: 'dueDate must be a valid date in YYYY-MM-DD format',
  })
  dueDate: string;

  @IsNotEmpty()
  @IsEnum(Importance)
  importance: Importance;

  @IsNotEmpty()
  @IsEnum(ExpenseType)
  type: ExpenseType;

  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  icon: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
