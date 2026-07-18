import { PartialType, IntersectionType } from '@nestjs/mapped-types';

import { CreateExpenseDto } from './create-expense.dto';
import { IsBoolean, IsOptional } from 'class-validator';

class IsExpenseActive {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateExpenseDto extends IntersectionType(
  PartialType(CreateExpenseDto),
  IsExpenseActive,
) {}
