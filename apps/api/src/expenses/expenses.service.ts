import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpensePeriodQueryDto } from './dto/expense-period-query.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { getPeriodEnd, isExpenseDueInPeriod } from './expense-schedule.util';

const expenseSummarySelect = {
  id: true,
  name: true,
  defaultAmount: true,
  billingPeriod: true,
  dueDate: true,
  type: true,
  icon: true,
};

function parseDateOnly(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    throw new BadRequestException('dueDate must be a valid calendar date');
  }

  return parsedDate;
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchAllExpenses(userId: string) {
    return await this.prisma.expense.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async fetchDueExpenses(userId: string, query: ExpensePeriodQueryDto) {
    const period = {
      periodMonth: query.periodMonth,
      periodYear: query.periodYear,
    };
    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        isActive: true,
        dueDate: {
          lte: getPeriodEnd(period),
        },
      },
      select: expenseSummarySelect,
      orderBy: {
        dueDate: 'asc',
      },
    });

    return expenses.filter((expense) => isExpenseDueInPeriod(expense, period));
  }

  async setExpense(userId: string, reqBody: CreateExpenseDto) {
    return await this.prisma.expense.create({
      data: {
        userId,
        name: reqBody.name,
        defaultAmount: reqBody.defaultAmount,
        billingPeriod: reqBody.billingPeriod,
        dueDate: parseDateOnly(reqBody.dueDate),
        importance: reqBody.importance,
        type: reqBody.type,
        icon: reqBody.icon,
        description: reqBody.description,
      },
    });
  }

  async fetchExpenseById(userId: string, expenseId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { userId, id: expenseId },
      include: { payments: true },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async updateExpense(
    userId: string,
    expenseId: string,
    reqBody: UpdateExpenseDto,
  ) {
    return await this.prisma.expense.update({
      data: {
        name: reqBody.name,
        defaultAmount: reqBody.defaultAmount,
        billingPeriod: reqBody.billingPeriod,
        dueDate: reqBody.dueDate ? parseDateOnly(reqBody.dueDate) : undefined,
        importance: reqBody.importance,
        type: reqBody.type,
        icon: reqBody.icon,
        description: reqBody.description,
      },
      where: { userId, id: expenseId },
    });
  }

  async removeExpense(userId: string, expenseId: string) {
    return await this.prisma.expense.update({
      data: {
        isActive: false,
      },
      where: { userId, id: expenseId },
    });
  }
}
