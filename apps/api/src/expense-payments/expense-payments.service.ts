import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateExpensePaymentDto } from './dto/create-expense-payment.dto';

@Injectable()
export class ExpensePaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async setExpensePayment(
    userId: string,
    expenseId: string,
    reqBody: CreateExpensePaymentDto,
  ) {
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
        paidAt: new Date(),
      },
      update: {
        amountSnapshot: reqBody.amountSnapshot,
        periodMonth: reqBody.periodMonth,
        periodYear: reqBody.periodYear,
        paidAt: new Date(),
      },
    });
  }

  async deleteExpensePayment(
    userId: string,
    periodMonth: number,
    periodYear: number,
    expenseId: string,
  ) {
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
}
