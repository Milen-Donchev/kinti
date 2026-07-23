import { Type } from 'class-transformer';
import {
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

const DEFAULT_AMOUNT_REGEX = /^\d{1,8}(\.\d{1,2})?$/;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateExpensePaymentDto {
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  periodMonth: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  periodYear: number;

  @IsString()
  @IsNotEmpty()
  @IsDecimal({
    decimal_digits: '1,2',
    force_decimal: false,
  })
  @Matches(DEFAULT_AMOUNT_REGEX, {
    message:
      'amountSnapshot must be at most 8 digits before the decimal and 2 after',
  })
  amountSnapshot: string;

  @IsOptional()
  @IsString()
  @Matches(DATE_ONLY_REGEX, {
    message: 'paidAt must be a valid date in YYYY-MM-DD format',
  })
  paidAt?: string;
}
