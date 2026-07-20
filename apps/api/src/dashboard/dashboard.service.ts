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
    const periodStart = new Date(
      Date.UTC(query.periodYear, query.periodMonth - 1, 1),
    );
    const periodEnd = new Date(
      Date.UTC(query.periodYear, query.periodMonth, 0),
    );

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          {
            billingPeriod: BillingPeriod.monthly,
            dueDate: {
              lte: periodEnd,
            },
          },
          {
            billingPeriod: BillingPeriod.yearly,
            dueDate: {
              lte: periodEnd,
            },
          },
          {
            billingPeriod: BillingPeriod.oneTime,
            dueDate: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
        ],
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

    const applicableExpenses = expenses.filter((expense) => {
      if (expense.billingPeriod !== BillingPeriod.yearly) {
        return true;
      }

      return expense.dueDate.getUTCMonth() + 1 === query.periodMonth;
    });

    const paidExpenses: PaidExpenseSummaryItem[] = [];
    const unpaidExpenses: UnpaidExpenseSummaryItem[] = [];

    let plannedTotal = new Prisma.Decimal(0);
    let paidTotal = new Prisma.Decimal(0);
    let remainingTotal = new Prisma.Decimal(0);

    for (const expense of applicableExpenses) {
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
        total: applicableExpenses.length,
        paid: paidExpenses.length,
        unpaid: unpaidExpenses.length,
      },
      paidExpenses,
      unpaidExpenses,
    };
  }
}
