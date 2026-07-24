import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardPeriodQueryDto } from './dto/dashboard-period-query.dto';
import {
  getPeriodEnd,
  isExpenseDueInPeriod,
} from '../expenses/expense-schedule.util';

const dashboardExpenseSelect = {
  id: true,
  name: true,
  defaultAmount: true,
  billingPeriod: true,
  dueDate: true,
  type: true,
  icon: true,
} satisfies Prisma.ExpenseSelect;

const dashboardPaymentSelect = {
  id: true,
  amountSnapshot: true,
  paidAt: true,
} satisfies Prisma.ExpensePaymentSelect;

type ExpenseWithPeriodPayments = Prisma.ExpenseGetPayload<{
  select: typeof dashboardExpenseSelect & {
    payments: {
      select: typeof dashboardPaymentSelect;
    };
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
    const period = {
      periodMonth: query.periodMonth,
      periodYear: query.periodYear,
    };
    const periodEnd = getPeriodEnd(period);

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        isActive: true,
        dueDate: {
          lte: periodEnd,
        },
      },
      select: {
        ...dashboardExpenseSelect,
        payments: {
          where: {
            periodMonth: query.periodMonth,
            periodYear: query.periodYear,
          },
          select: dashboardPaymentSelect,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const applicableExpenses = expenses.filter((expense) =>
      isExpenseDueInPeriod(expense, period),
    );

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
