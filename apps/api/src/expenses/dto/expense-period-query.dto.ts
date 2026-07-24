import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ExpensePeriodQueryDto {
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
}
