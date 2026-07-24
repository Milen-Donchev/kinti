import { BillingPeriod } from '@prisma/client';

type ScheduledExpense = {
  billingPeriod: BillingPeriod;
  dueDate: Date;
};

type Period = {
  periodMonth: number;
  periodYear: number;
};

export function getPeriodStart({ periodMonth, periodYear }: Period) {
  return new Date(Date.UTC(periodYear, periodMonth - 1, 1));
}

export function getPeriodEnd({ periodMonth, periodYear }: Period) {
  return new Date(Date.UTC(periodYear, periodMonth, 0));
}

export function getDaysInPeriod({ periodMonth, periodYear }: Period) {
  return getPeriodEnd({ periodMonth, periodYear }).getUTCDate();
}

export function getScheduledDayInPeriod(
  dueDate: Date,
  { periodMonth, periodYear }: Period,
) {
  return Math.min(
    dueDate.getUTCDate(),
    getDaysInPeriod({ periodMonth, periodYear }),
  );
}

export function isExpenseDueInPeriod(
  expense: ScheduledExpense,
  period: Period,
) {
  const periodEnd = getPeriodEnd(period);

  if (expense.dueDate > periodEnd) {
    return false;
  }

  if (expense.billingPeriod === BillingPeriod.monthly) {
    return true;
  }

  if (expense.billingPeriod === BillingPeriod.yearly) {
    return expense.dueDate.getUTCMonth() + 1 === period.periodMonth;
  }

  return (
    expense.dueDate.getUTCFullYear() === period.periodYear &&
    expense.dueDate.getUTCMonth() + 1 === period.periodMonth
  );
}

export function getExpenseDueDateInPeriod(
  expense: ScheduledExpense,
  period: Period,
) {
  if (!isExpenseDueInPeriod(expense, period)) {
    return null;
  }

  const day = getScheduledDayInPeriod(expense.dueDate, period);

  return new Date(Date.UTC(period.periodYear, period.periodMonth - 1, day));
}
