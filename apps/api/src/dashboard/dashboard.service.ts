import { Injectable } from '@nestjs/common';
import { BillingPeriod, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardPeriodQueryDto } from './dto/dashboard-period-query.dto';

type ExpenseWithPeriodPayments = Prisma.ExpenseGetPayload<{
  include: {
    payments: true;
  };
}>;

type PaidExpenseSummaryItem = {
  expense: ExpenseWithPeriodPayments;
  payment: ExpenseWithPeriodPayments['payments'][number];
  amount: string;
};

type UnpaidExpenseSummaryItem = {
  expense: ExpenseWithPeriodPayments;
  expectedAmount: string;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlySummary(userId: string, query: DashboardPeriodQueryDto) {
    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        isActive: true,
        billingPeriod: BillingPeriod.monthly,
      },
      include: {
        payments: {
          where: {
            periodMonth: query.periodMonth,
            periodYear: query.periodYear,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const paidExpenses: PaidExpenseSummaryItem[] = [];
    const unpaidExpenses: UnpaidExpenseSummaryItem[] = [];

    let plannedTotal = new Prisma.Decimal(0);
    let paidTotal = new Prisma.Decimal(0);
    let remainingTotal = new Prisma.Decimal(0);

    for (const expense of expenses) {
      plannedTotal = plannedTotal.plus(expense.defaultAmount);

      const payment = expense.payments[0];

      if (payment) {
        paidTotal = paidTotal.plus(payment.amountSnapshot);

        paidExpenses.push({
          expense,
          payment,
          amount: payment.amountSnapshot.toString(),
        });
      } else {
        remainingTotal = remainingTotal.plus(expense.defaultAmount);

        unpaidExpenses.push({
          expense,
          expectedAmount: expense.defaultAmount.toString(),
        });
      }
    }

    const projectedTotal = paidTotal.plus(remainingTotal);

    return {
      period: {
        month: query.periodMonth,
        year: query.periodYear,
      },
      totals: {
        planned: plannedTotal.toString(),
        paid: paidTotal.toString(),
        remaining: remainingTotal.toString(),
        projected: projectedTotal.toString(),
      },
      counts: {
        total: expenses.length,
        paid: paidExpenses.length,
        unpaid: unpaidExpenses.length,
      },
      paidExpenses,
      unpaidExpenses,
    };
  }
}
