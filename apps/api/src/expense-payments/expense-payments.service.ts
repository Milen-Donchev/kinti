import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateExpensePaymentDto } from './dto/create-expense-payment.dto';
import { isExpenseDueInPeriod } from '../expenses/expense-schedule.util';

function parseDateOnly(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    throw new BadRequestException('paidAt must be a valid calendar date');
  }

  return parsedDate;
}

@Injectable()
export class ExpensePaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async setExpensePayment(
    userId: string,
    expenseId: string,
    reqBody: CreateExpensePaymentDto,
  ) {
    const expense = await this.getPayableExpense(userId, expenseId);
    const period = {
      periodMonth: reqBody.periodMonth,
      periodYear: reqBody.periodYear,
    };

    if (!isExpenseDueInPeriod(expense, period)) {
      throw new BadRequestException(
        'Expense is not due in the selected period',
      );
    }

    const paidAt = reqBody.paidAt ? parseDateOnly(reqBody.paidAt) : new Date();

    return await this.prisma.expensePayment.upsert({
      where: {
        expenseId_periodMonth_periodYear: {
          expenseId,
          periodMonth: reqBody.periodMonth,
          periodYear: reqBody.periodYear,
        },
      },
      create: {
        userId,
        expenseId,
        amountSnapshot: reqBody.amountSnapshot,
        periodMonth: reqBody.periodMonth,
        periodYear: reqBody.periodYear,
        paidAt,
      },
      update: {
        amountSnapshot: reqBody.amountSnapshot,
        periodMonth: reqBody.periodMonth,
        periodYear: reqBody.periodYear,
        paidAt,
      },
    });
  }

  async deleteExpensePayment(
    userId: string,
    periodMonth: number,
    periodYear: number,
    expenseId: string,
  ) {
    const expense = await this.getPayableExpense(userId, expenseId);

    if (
      !isExpenseDueInPeriod(expense, {
        periodMonth,
        periodYear,
      })
    ) {
      throw new BadRequestException(
        'Expense is not due in the selected period',
      );
    }

    return await this.prisma.expensePayment.delete({
      where: {
        expenseId_periodMonth_periodYear: {
          expenseId,
          periodMonth,
          periodYear,
        },
        AND: {
          userId,
        },
      },
    });
  }

  async fetchExpensePaymentsByPeriod(
    userId: string,
    periodMonth: number,
    periodYear: number,
    expenseId: string,
  ) {
    if (!periodYear) {
      throw new BadRequestException('Year must be provided');
    }

    return await this.prisma.expensePayment.findMany({
      where: {
        expenseId,
        userId,
        periodYear,
        ...(!!periodMonth && { periodMonth }),
      },
      include: {
        expense: true,
      },
      orderBy: {
        paidAt: 'desc',
      },
    });
  }

  async fetchPaymentsByPeriod(
    userId: string,
    periodMonth: number,
    periodYear: number,
  ) {
    return await this.prisma.expensePayment.findMany({
      where: {
        userId,
        periodMonth,
        periodYear,
      },
      orderBy: {
        paidAt: 'desc',
      },
    });
  }

  private async getPayableExpense(userId: string, expenseId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: {
        id: expenseId,
        userId,
      },
      select: {
        billingPeriod: true,
        dueDate: true,
        isActive: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (!expense.isActive) {
      throw new BadRequestException(
        'Modifying inactive expenses is not allowed',
      );
    }

    return expense;
  }
}
