import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Loader2,
  Undo2,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { useAppearance } from '@/app/appearance-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getExpenseIcon } from '@/features/expenses/expense-options'
import { MarkExpensePaidModal } from '@/features/expenses/mark-expense-paid-modal'
import { useI18n } from '@/i18n/i18n-context'
import { apiRequest } from '@/lib/api'
import type { Currency, Expense, ExpensePayment } from '@/lib/types'
import { getIconTone } from '@/lib/visuals'

const currencyCodes: Record<Currency, string> = {
  eur: 'EUR',
  usd: 'USD',
  gbp: 'GBP',
}

function getCurrentPeriod() {
  const now = new Date()

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }
}

function shiftPeriod(
  period: { month: number; year: number },
  offset: number,
) {
  const date = new Date(period.year, period.month - 1 + offset, 1)

  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  }
}

function formatMoney(value: string, language: string, currency: Currency) {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: currencyCodes[currency] ?? currencyCodes.eur,
  }).format(Number(value))
}

function formatPeriodLabel(
  period: { month: number; year: number },
  language: string,
) {
  return new Intl.DateTimeFormat(language, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(period.year, period.month - 1, 1))
}

function formatSelectedDate(
  period: { month: number; year: number },
  day: number,
  language: string,
) {
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(period.year, period.month - 1, day))
}

function parseDateValue(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)

  return new Date(year, month - 1, day)
}

export function CalendarPage() {
  const { language, t } = useI18n()
  const { appearance } = useAppearance()
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState(getCurrentPeriod)
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate())
  const [expenseToMarkPaid, setExpenseToMarkPaid] = useState<Expense | null>(
    null,
  )
  const currentPeriod = getCurrentPeriod()
  const isCurrentPeriod =
    period.month === currentPeriod.month && period.year === currentPeriod.year
  const expensesQuery = useQuery({
    queryKey: ['expenses'],
    queryFn: () => apiRequest<Expense[]>('/expenses'),
  })
  const paymentsQuery = useQuery({
    queryKey: ['payments', period.year, period.month],
    queryFn: () =>
      apiRequest<ExpensePayment[]>(
        `/payments?periodMonth=${period.month}&periodYear=${period.year}`,
      ),
  })
  const calendarDays = useMemo(
    () => buildCalendarDays(expensesQuery.data ?? [], period),
    [expensesQuery.data, period],
  )
  const paymentsByExpenseId = useMemo(() => {
    return new Map(
      (paymentsQuery.data ?? []).map((payment) => [
        payment.expenseId,
        payment,
      ]),
    )
  }, [paymentsQuery.data])
  const selectedCalendarDay = calendarDays.find(
    (day) => !day.isPlaceholder && day.dayOfMonth === selectedDay,
  )
  const undoPaymentMutation = useMutation({
    mutationFn: (expenseId: string) =>
      apiRequest(
        `/payments/expenses/${expenseId}?periodMonth=${period.month}&periodYear=${period.year}`,
        {
          method: 'DELETE',
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['dashboard-summary', period.year, period.month],
        }),
        queryClient.invalidateQueries({
          queryKey: ['payments', period.year, period.month],
        }),
      ])
    },
  })

  function setVisiblePeriod(nextPeriod: { month: number; year: number }) {
    setPeriod(nextPeriod)
    setSelectedDay(1)
  }

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-3xl border-2 border-[#b77dff] bg-[#f0e4ff] p-5 shadow-[0_7px_0_#8e58d1] dark:bg-[#32224d]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge className="border-2 border-[#b77dff] bg-white text-[#8e58d1] shadow-[0_3px_0_#b77dff] dark:bg-slate-950 dark:text-violet-200">
              <CalendarDays size={13} className="mr-1" />
              {t('calendar.badge')}
            </Badge>
            <h1 className="mt-3 text-3xl font-extrabold tracking-normal">
              {t('calendar.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--muted-foreground))]">
              {t('calendar.description')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border-2 border-[#b77dff] bg-white/90 p-1.5 shadow-[0_4px_0_#8e58d1] dark:bg-slate-950/70">
              <Button
                className="h-9 w-9 rounded-xl px-0 shadow-[0_3px_0_rgb(var(--border))]"
                type="button"
                variant="secondary"
                aria-label={t('dashboard.previousMonth')}
                onClick={() =>
                  setVisiblePeriod(shiftPeriod(period, -1))
                }
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="inline-flex min-w-[156px] items-center justify-center gap-2 px-2 text-sm font-extrabold">
                <CalendarDays size={15} />
                {formatPeriodLabel(period, language)}
              </span>
              <Button
                className="h-9 w-9 rounded-xl px-0 shadow-[0_3px_0_rgb(var(--border))]"
                type="button"
                variant="secondary"
                aria-label={t('dashboard.nextMonth')}
                onClick={() =>
                  setVisiblePeriod(shiftPeriod(period, 1))
                }
              >
                <ChevronRight size={16} />
              </Button>
            </div>
            {!isCurrentPeriod ? (
              <Button
                className="h-10 px-4 text-xs"
                type="button"
                variant="secondary"
                onClick={() => setVisiblePeriod(currentPeriod)}
              >
                {t('dashboard.currentMonth')}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {expensesQuery.isLoading ? (
        <Card>
          <CardContent className="pt-5 text-sm text-[rgb(var(--muted-foreground))]">
            {t('expenses.loading')}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-2 rounded-3xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 shadow-[0_5px_0_rgb(var(--border))]">
          <div className="grid grid-cols-7 gap-2">
            {getWeekdayLabels(language).map((label) => (
              <div
                key={label}
                className="px-2 py-2 text-center text-xs font-extrabold uppercase text-[rgb(var(--muted-foreground))]"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) =>
              day.isPlaceholder ? (
                <div
                  key={day.key}
                  className="aspect-square rounded-2xl border-2 border-transparent"
                />
              ) : (
                <button
                  key={day.key}
                  type="button"
                  className={
                    selectedDay === day.dayOfMonth
                      ? 'aspect-square rounded-2xl border-2 border-[#29c776] bg-[#ddfbea] p-2 text-left shadow-[0_4px_0_#16a063] dark:bg-[#153a2b] dark:shadow-[0_4px_0_#0f7f50]'
                      : 'aspect-square rounded-2xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-2 text-left shadow-[0_3px_0_rgb(var(--border))] transition-all hover:-translate-y-0.5 hover:bg-[rgb(var(--surface))]'
                  }
                  onClick={() => setSelectedDay(day.dayOfMonth)}
                >
                  <span className="flex h-full flex-col justify-between">
                    <span className="text-sm font-extrabold">
                      {day.dayOfMonth}
                    </span>
                    {day.expenses.length ? (
                      <span className="grid gap-1">
                        <span className="flex gap-1">
                          {day.expenses.slice(0, 3).map((expense) => {
                            const tone = getIconTone(expense.icon)

                            return (
                              <span
                                key={expense.id}
                                className={`h-2 w-2 rounded-full ${tone.bg}`}
                              />
                            )
                          })}
                        </span>
                        <span className="text-[11px] font-extrabold text-[rgb(var(--muted-foreground))]">
                          {t('calendar.expenseCount', {
                            count: day.expenses.length,
                          })}
                        </span>
                      </span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[rgb(var(--border))]" />
                    )}
                  </span>
                </button>
              ),
            )}
          </div>
        </div>

        <aside className="rounded-3xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[0_5px_0_rgb(var(--border))]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-[rgb(var(--muted-foreground))]">
                {t('calendar.selectedDay')}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-normal">
                {formatSelectedDate(period, selectedDay, language)}
              </h2>
            </div>
            <span className="rounded-xl border-2 border-[#b77dff] bg-[#f0e4ff] px-3 py-1.5 text-xs font-extrabold text-[#8e58d1] shadow-[0_3px_0_#8e58d1] dark:bg-[#32224d] dark:text-violet-100">
              {selectedCalendarDay?.expenses.length ?? 0}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {selectedCalendarDay?.expenses.length ? (
              selectedCalendarDay.expenses.map((expense) => {
                const payment = paymentsByExpenseId.get(expense.id)

                return (
                  <CalendarExpenseLine
                    key={expense.id}
                    expense={expense}
                    payment={payment}
                    amount={formatMoney(
                      payment?.amountSnapshot ?? expense.defaultAmount,
                      language,
                      appearance.currency,
                    )}
                    meta={
                      payment
                        ? `${t('dashboard.meta.paid')} · ${formatShortDate(
                            payment.paidAt,
                            language,
                          )}`
                        : translateBillingPeriod(expense.billingPeriod, t)
                    }
                    markPaidLabel={t('dashboard.markPaid')}
                    undoLabel={t('dashboard.undoPayment')}
                    isUndoPending={undoPaymentMutation.isPending}
                    onMarkPaid={() => setExpenseToMarkPaid(expense)}
                    onUndo={() => undoPaymentMutation.mutate(expense.id)}
                  />
                )
              })
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-4 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
                {t('calendar.noExpensesForDay')}
              </div>
            )}
          </div>
        </aside>
      </section>

      {expensesQuery.data && expensesQuery.data.length === 0 ? (
        <Card className="overflow-hidden border-[#35b9ff] bg-[#e2f6ff] dark:bg-[#15334a]">
          <CardContent className="grid place-items-center gap-4 py-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#35b9ff] text-white shadow-[0_5px_0_#1688c7]">
              <CircleDollarSign size={22} />
            </div>
            <div>
              <h2 className="font-extrabold">{t('calendar.emptyTitle')}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[rgb(var(--muted-foreground))]">
                {t('calendar.emptyDescription')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <MarkExpensePaidModal
        expense={expenseToMarkPaid}
        period={period}
        onClose={() => setExpenseToMarkPaid(null)}
      />
    </div>
  )
}

type CalendarDay =
  | {
      key: string
      isPlaceholder: true
      dayOfMonth?: never
      expenses: Expense[]
    }
  | {
      key: string
      isPlaceholder: false
      dayOfMonth: number
      expenses: Expense[]
    }

function buildCalendarDays(
  expenses: Expense[],
  period: { month: number; year: number },
) {
  const daysInMonth = new Date(period.year, period.month, 0).getDate()
  const firstDay = new Date(period.year, period.month - 1, 1)
  const leadingPlaceholders = (firstDay.getDay() + 6) % 7
  const days: CalendarDay[] = Array.from(
    { length: leadingPlaceholders },
    (_, index) => ({
      key: `placeholder-${index}`,
      isPlaceholder: true,
      expenses: [],
    }),
  )

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      key: `day-${day}`,
      isPlaceholder: false,
      dayOfMonth: day,
      expenses: expenses.filter((expense) =>
        isExpenseDueOnDay(expense, day, period),
      ),
    })
  }

  return days
}

function isExpenseDueOnDay(
  expense: Expense,
  day: number,
  period: { month: number; year: number },
) {
  const dueDate = parseDateValue(expense.dueDate)
  const periodEnd = new Date(period.year, period.month, 0)

  if (dueDate > periodEnd) {
    return false
  }

  if (expense.billingPeriod === 'monthly') {
    const dueDay = Math.min(
      dueDate.getDate(),
      new Date(period.year, period.month, 0).getDate(),
    )

    return dueDay === day
  }

  if (expense.billingPeriod === 'yearly') {
    return dueDate.getMonth() + 1 === period.month && dueDate.getDate() === day
  }

  return (
    dueDate.getFullYear() === period.year &&
    dueDate.getMonth() + 1 === period.month &&
    dueDate.getDate() === day
  )
}

function getWeekdayLabels(language: string) {
  const monday = new Date(2026, 0, 5)

  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(language, { weekday: 'short' }).format(
      new Date(2026, 0, monday.getDate() + index),
    ),
  )
}

function CalendarExpenseLine({
  expense,
  payment,
  amount,
  meta,
  markPaidLabel,
  undoLabel,
  isUndoPending,
  onMarkPaid,
  onUndo,
}: {
  expense: Expense
  payment?: ExpensePayment
  amount: string
  meta: string
  markPaidLabel: string
  undoLabel: string
  isUndoPending: boolean
  onMarkPaid: () => void
  onUndo: () => void
}) {
  const Icon = getExpenseIcon(expense.icon)
  const tone = getIconTone(expense.icon)

  return (
    <div className="grid gap-3 rounded-2xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-3 shadow-[0_3px_0_rgb(var(--border))]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone.bg}`}
          >
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{expense.name}</p>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">
              {meta}
            </p>
          </div>
        </div>
        <p className="shrink-0 text-sm font-extrabold">{amount}</p>
      </div>

      <div className="flex justify-end">
        {payment ? (
          <Button
            className="h-9 px-3 text-xs"
            type="button"
            variant="secondary"
            disabled={isUndoPending}
            onClick={onUndo}
          >
            {isUndoPending ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Undo2 size={14} />
            )}
            {undoLabel}
          </Button>
        ) : (
          <Button className="h-9 px-3 text-xs" type="button" onClick={onMarkPaid}>
            <Check size={14} />
            {markPaidLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

function formatShortDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseDateValue(value))
}

function translateBillingPeriod(
  period: Expense['billingPeriod'],
  t: ReturnType<typeof useI18n>['t'],
) {
  if (period === 'monthly') {
    return t('expenses.period.monthly')
  }

  if (period === 'yearly') {
    return t('expenses.period.yearly')
  }

  return t('expenses.period.oneTime')
}
