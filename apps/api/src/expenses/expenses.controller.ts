import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

import type { AuthUser } from '../auth/types';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('expenses')
@UseGuards(AuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async getAllExpenses(@CurrentUser() user: AuthUser) {
    return this.expensesService.fetchAllExpenses(user.id);
  }

  @Post()
  async createExpense(
    @CurrentUser() user: AuthUser,
    @Body() reqBody: CreateExpenseDto,
  ) {
    return this.expensesService.setExpense(user.id, reqBody);
  }

  @Get(':id')
  async getExpenseById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expensesService.fetchExpenseById(user.id, id);
  }

  @Put(':id')
  async editExpense(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() reqBody: UpdateExpenseDto,
  ) {
    return this.expensesService.updateExpense(user.id, id, reqBody);
  }

  @Delete(':id')
  async deleteExpense(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expensesService.removeExpense(user.id, id);
  }
}
