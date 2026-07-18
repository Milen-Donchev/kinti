import { PickType } from '@nestjs/mapped-types';

import { CreateExpensePaymentDto } from './create-expense-payment.dto';

export class ExpensePaymentParamsDto extends PickType(CreateExpensePaymentDto, [
  'periodMonth',
  'periodYear',
]) {}
