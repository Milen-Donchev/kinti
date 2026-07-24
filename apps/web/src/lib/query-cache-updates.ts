import type { QueryClient } from '@tanstack/react-query'

import { queryKeys, type PeriodKey } from '@/lib/query-keys'
import type {
  DashboardSummary,
  Expense,
  ExpenseDetails,
  ExpensePayment,
  ExpenseSummary,
} from '@/lib/types'

type MarkPaidInput = {
  expense: ExpenseSummary
  period: PeriodKey
  amountSnapshot: string
  paidAt: string
}

function toAmount(value: string) {
  const amount = Number(value)

  return Number.isFinite(amount) ? amount : 0
}

function toMoneyString(value: number) {
  return value.toFixed(2)
}

function createOptimisticPayment({
  expense,
  period,
  amountSnapshot,
  paidAt,
}: MarkPaidInput): ExpensePayment {
  return {
    id: `optimistic-${expense.id}-${period.year}-${period.month}`,
    expenseId: expense.id,
    userId: 'optimistic',
    periodMonth: period.month,
    periodYear: period.year,
    amountSnapshot,
    paidAt,
  }
}

function updateDashboardAfterMarkPaid(
  summary: DashboardSummary | undefined,
  { expense, amountSnapshot, paidAt }: MarkPaidInput,
) {
  if (!summary) {
    return summary
  }

  const unpaidItem = summary.unpaidExpenses.find(
    (item) => item.expense.id === expense.id,
  )

  if (!unpaidItem) {
    return summary
  }

  const paidAmount = toAmount(amountSnapshot)
  const remainingAmount = toAmount(unpaidItem.expectedAmount)
  const nextPaid = toAmount(summary.totals.paid) + paidAmount
  const nextRemaining = Math.max(
    toAmount(summary.totals.remaining) - remainingAmount,
    0,
  )

  return {
    ...summary,
    totals: {
      ...summary.totals,
      paid: toMoneyString(nextPaid),
      remaining: toMoneyString(nextRemaining),
      projected: toMoneyString(nextPaid + nextRemaining),
    },
    counts: {
      ...summary.counts,
      paid: summary.counts.paid + 1,
      unpaid: Math.max(summary.counts.unpaid - 1, 0),
    },
    unpaidExpenses: summary.unpaidExpenses.filter(
      (item) => item.expense.id !== expense.id,
    ),
    paidExpenses: [
      {
        expense,
        payment: {
          id: `optimistic-${expense.id}`,
          amountSnapshot,
          paidAt,
        },
        amount: amountSnapshot,
      },
      ...summary.paidExpenses,
    ],
  }
}

function updateDashboardAfterUndo(
  summary: DashboardSummary | undefined,
  expenseId: string,
) {
  if (!summary) {
    return summary
  }

  const paidItem = summary.paidExpenses.find(
    (item) => item.expense.id === expenseId,
  )

  if (!paidItem) {
    return summary
  }

  const paidAmount = toAmount(paidItem.amount)
  const expectedAmount = toAmount(paidItem.expense.defaultAmount)
  const nextPaid = Math.max(toAmount(summary.totals.paid) - paidAmount, 0)
  const nextRemaining = toAmount(summary.totals.remaining) + expectedAmount

  return {
    ...summary,
    totals: {
      ...summary.totals,
      paid: toMoneyString(nextPaid),
      remaining: toMoneyString(nextRemaining),
      projected: toMoneyString(nextPaid + nextRemaining),
    },
    counts: {
      ...summary.counts,
      paid: Math.max(summary.counts.paid - 1, 0),
      unpaid: summary.counts.unpaid + 1,
    },
    paidExpenses: summary.paidExpenses.filter(
      (item) => item.expense.id !== expenseId,
    ),
    unpaidExpenses: [
      {
        expense: paidItem.expense,
        expectedAmount: paidItem.expense.defaultAmount,
      },
      ...summary.unpaidExpenses,
    ],
  }
}

export function addExpenseToCache(queryClient: QueryClient, expense: Expense) {
  queryClient.setQueryData<Expense[]>(queryKeys.expenses(), (current = []) => [
    expense,
    ...current.filter((item) => item.id !== expense.id),
  ])
}

export function updateExpenseInCache(
  queryClient: QueryClient,
  expense: Expense,
) {
  queryClient.setQueryData<Expense[]>(queryKeys.expenses(), (current = []) =>
    current.map((item) => (item.id === expense.id ? expense : item)),
  )
  queryClient.setQueryData<ExpenseDetails>(
    queryKeys.expense(expense.id),
    (current) =>
      current
        ? {
            ...expense,
            payments: current.payments,
          }
        : current,
  )
}

export function removeExpenseFromListCache(
  queryClient: QueryClient,
  expenseId: string,
) {
  queryClient.setQueryData<Expense[]>(queryKeys.expenses(), (current = []) =>
    current.filter((item) => item.id !== expenseId),
  )
}

export function markExpensePaidInCache(
  queryClient: QueryClient,
  input: MarkPaidInput,
) {
  const payment = createOptimisticPayment(input)

  queryClient.setQueryData<DashboardSummary>(
    queryKeys.dashboardSummary(input.period),
    (current) => updateDashboardAfterMarkPaid(current, input),
  )
  queryClient.setQueryData<ExpensePayment[]>(
    queryKeys.payments(input.period),
    (current = []) => [
      payment,
      ...current.filter((item) => item.expenseId !== input.expense.id),
    ],
  )
  queryClient.setQueryData<ExpenseDetails>(
    queryKeys.expense(input.expense.id),
    (current) =>
      current
        ? {
            ...current,
            payments: [
              payment,
              ...current.payments.filter(
                (item) =>
                  item.periodMonth !== input.period.month ||
                  item.periodYear !== input.period.year,
              ),
            ],
          }
        : current,
  )
}

export function undoPaymentInCache(
  queryClient: QueryClient,
  period: PeriodKey,
  expenseId: string,
) {
  queryClient.setQueryData<DashboardSummary>(
    queryKeys.dashboardSummary(period),
    (current) => updateDashboardAfterUndo(current, expenseId),
  )
  queryClient.setQueryData<ExpensePayment[]>(
    queryKeys.payments(period),
    (current = []) => current.filter((item) => item.expenseId !== expenseId),
  )
  queryClient.setQueryData<ExpenseDetails>(
    queryKeys.expense(expenseId),
    (current) =>
      current
        ? {
            ...current,
            payments: current.payments.filter(
              (item) =>
                item.periodMonth !== period.month ||
                item.periodYear !== period.year,
            ),
          }
        : current,
  )
}
