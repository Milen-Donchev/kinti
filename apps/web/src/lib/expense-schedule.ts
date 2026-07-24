import type { BillingPeriod } from '@/lib/types'

type ScheduledExpense = {
  billingPeriod: BillingPeriod
  dueDate: string
}

export type ExpensePeriod = {
  month: number
  year: number
}

export function parseDateValue(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)

  return new Date(year, month - 1, day)
}

export function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getDaysInPeriod(period: ExpensePeriod) {
  return new Date(period.year, period.month, 0).getDate()
}

export function getScheduledDayInPeriod(
  dueDate: Date,
  period: ExpensePeriod,
) {
  return Math.min(dueDate.getDate(), getDaysInPeriod(period))
}

export function getScheduledDateInPeriod(
  dueDate: Date,
  period: ExpensePeriod,
) {
  return new Date(
    period.year,
    period.month - 1,
    getScheduledDayInPeriod(dueDate, period),
  )
}

export function isExpenseDueInPeriod(
  expense: ScheduledExpense,
  period: ExpensePeriod,
) {
  const dueDate = parseDateValue(expense.dueDate)
  const periodEnd = new Date(period.year, period.month, 0)

  if (dueDate > periodEnd) {
    return false
  }

  if (expense.billingPeriod === 'monthly') {
    return true
  }

  if (expense.billingPeriod === 'yearly') {
    return dueDate.getMonth() + 1 === period.month
  }

  return (
    dueDate.getFullYear() === period.year &&
    dueDate.getMonth() + 1 === period.month
  )
}

export function getExpenseDueDateInPeriod(
  expense: ScheduledExpense,
  period: ExpensePeriod,
) {
  if (!isExpenseDueInPeriod(expense, period)) {
    return null
  }

  const dueDate = parseDateValue(expense.dueDate)

  if (expense.billingPeriod === 'oneTime') {
    return dueDate
  }

  return getScheduledDateInPeriod(dueDate, period)
}
