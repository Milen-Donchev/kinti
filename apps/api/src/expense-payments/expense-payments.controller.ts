import {
  Controller,
  Post,
  UseGuards,
  Body,
  Param,
  Delete,
  Query,
  Get,
} from '@nestjs/common';

import type { AuthUser } from '../auth/types';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

import { ExpensePaymentsService } from './expense-payments.service';
import { CreateExpensePaymentDto } from './dto/create-expense-payment.dto';
import { ExpensePaymentParamsDto } from './dto/expense-payment-params.dto';

@Controller('payments')
@UseGuards(AuthGuard)
export class ExpensePaymentsController {
  constructor(
    private readonly expensePaymentsService: ExpensePaymentsService,
  ) {}

  @Get()
  async getAllPaymentsForPeriod(
    @CurrentUser() user: AuthUser,
    @Query() { periodMonth, periodYear }: ExpensePaymentParamsDto,
  ) {
    return this.expensePaymentsService.fetchPaymentsByPeriod(
      user.id,
      periodMonth,
      periodYear,
    );
  }

  @Post('/expenses/:id')
  async createExpensePayment(
    @CurrentUser() user: AuthUser,
    @Param('id') expenseId: string,
    @Body() reqBody: CreateExpensePaymentDto,
  ) {
    return this.expensePaymentsService.setExpensePayment(
      user.id,
      expenseId,
      reqBody,
    );
  }

  @Delete('expenses/:id')
  async removeExpensePayment(
    @CurrentUser() user: AuthUser,
    @Query() { periodMonth, periodYear }: ExpensePaymentParamsDto,
    @Param('id') expenseId: string,
  ) {
    return this.expensePaymentsService.deleteExpensePayment(
      user.id,
      periodMonth,
      periodYear,
      expenseId,
    );
  }

  @Get('expenses/:id')
  async getExpensePaymentsByPeriod(
    @CurrentUser() user: AuthUser,
    @Query() { periodMonth, periodYear }: ExpensePaymentParamsDto,
    @Param('id') expenseId: string,
  ) {
    return this.expensePaymentsService.fetchExpensePaymentsByPeriod(
      user.id,
      periodMonth,
      periodYear,
      expenseId,
    );
  }
}
