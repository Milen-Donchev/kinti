import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleDollarSign,
  Loader2,
  ReceiptText,
  RefreshCw,
  Undo2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { useAppearance } from '@/app/appearance-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getExpenseIcon } from '@/features/expenses/expense-options'
import { MarkExpensePaidModal } from '@/features/expenses/mark-expense-paid-modal'
import { useI18n } from '@/i18n/i18n-context'
import { apiRequest } from '@/lib/api'
import {
  isExpenseDueInPeriod,
  parseDateValue,
} from '@/lib/expense-schedule'
import { undoPaymentInCache } from '@/lib/query-cache-updates'
import { queryKeys } from '@/lib/query-keys'
import type { Currency, Expense, ExpenseDetails, ExpensePayment } from '@/lib/types'
import { getBillingPeriodTone, getIconTone, getImportanceTone } from '@/lib/visuals'

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

function formatMoney(value: string, language: string, currency: Currency) {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: currencyCodes[currency] ?? currencyCodes.eur,
  }).format(Number(value))
}

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
  }).format(parseDateValue(value))
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

export function ExpenseDetailsPage() {
  const { expenseId } = useParams()
  const { language, t } = useI18n()
  const { appearance } = useAppearance()
  const queryClient = useQueryClient()
  const [expenseToMarkPaid, setExpenseToMarkPaid] = useState<Expense | null>(
    null,
  )
  const currentPeriod = getCurrentPeriod()
  const expenseQuery = useQuery({
    queryKey: queryKeys.expense(expenseId ?? ''),
    enabled: Boolean(expenseId),
    queryFn: () => apiRequest<ExpenseDetails>(`/expenses/${expenseId}`),
  })
  const expense = expenseQuery.data
  const sortedPayments = useMemo(() => {
    return [...(expense?.payments ?? [])].sort((first, second) => {
      return (
        new Date(second.paidAt).getTime() - new Date(first.paidAt).getTime()
      )
    })
  }, [expense?.payments])
  const currentPayment = sortedPayments.find(
    (payment) =>
      payment.periodMonth === currentPeriod.month &&
      payment.periodYear === currentPeriod.year,
  )
  const paidTotal = sortedPayments.reduce(
    (total, payment) => total + Number(payment.amountSnapshot),
    0,
  )
  const undoPaymentMutation = useMutation({
    mutationFn: () => {
      if (!expense) {
        throw new Error('Missing expense.')
      }

      return apiRequest(
        `/payments/expenses/${expense.id}?periodMonth=${currentPeriod.month}&periodYear=${currentPeriod.year}`,
        {
          method: 'DELETE',
        },
      )
    },
    onMutate: async () => {
      if (!expense) {
        return
      }

      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.expense(expense.id) }),
        queryClient.cancelQueries({
          queryKey: queryKeys.payments(currentPeriod),
        }),
        queryClient.cancelQueries({
          queryKey: queryKeys.dashboardSummary(currentPeriod),
        }),
      ])
      undoPaymentInCache(queryClient, currentPeriod, expense.id)
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.expense(expenseId ?? ''),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.payments(currentPeriod),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardSummary(currentPeriod),
        }),
      ])
    },
  })

  if (!expenseId) {
    return <Navigate to="/expenses" replace />
  }

  if (expenseQuery.isLoading) {
    return (
      <Card className="overflow-hidden border-[#35b9ff] bg-[#e2f6ff] dark:bg-[#15334a]">
        <CardContent className="grid place-items-center gap-4 py-10 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#35b9ff] text-white shadow-[0_5px_0_#1688c7]">
            <Loader2 className="animate-spin" size={22} />
          </div>
          <p className="text-sm font-extrabold text-[rgb(var(--muted-foreground))]">
            {t('expenseDetails.loading')}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (expenseQuery.isError || !expense) {
    return (
      <Card className="overflow-hidden border-[#ff6b7a] bg-[#ffe4e8] dark:bg-[#4f232c]">
        <CardContent className="grid gap-4 py-8">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff6b7a] text-white shadow-[0_5px_0_#d64b58]">
            <ReceiptText size={22} />
          </div>
          <p className="text-sm font-extrabold text-[rgb(var(--danger))]">
            {t('expenseDetails.loadError')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void expenseQuery.refetch()}
            >
              <RefreshCw size={16} />
              {t('common.retry')}
            </Button>
            <Button asChild variant="secondary">
              <Link to="/expenses">
                <ArrowLeft size={16} />
                {t('expenseDetails.backToExpenses')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const Icon = getExpenseIcon(expense.icon)
  const iconTone = getIconTone(expense.icon)
  const periodTone = getBillingPeriodTone(expense.billingPeriod)
  const importanceTone = getImportanceTone(expense.importance)
  const isDueInCurrentPeriod = isExpenseDueInPeriod(expense, currentPeriod)

  return (
    <div className="grid gap-5">
      <Button asChild className="w-fit" variant="secondary">
        <Link to="/expenses">
          <ArrowLeft size={16} />
          {t('expenseDetails.backToExpenses')}
        </Link>
      </Button>

      <section
        className={`overflow-hidden rounded-3xl border-2 p-4 shadow-[0_6px_0_rgb(var(--border))] ${iconTone.soft} ${iconTone.border}`}
      >
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="flex min-w-0 gap-4">
            <div
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${iconTone.bg}`}
            >
              <Icon size={24} />
            </div>
            <div className="min-w-0">
              <Badge className={`border-2 ${periodTone.border} ${periodTone.soft}`}>
                <CalendarDays size={13} className="mr-1" />
                {translateBillingPeriod(expense.billingPeriod, t)}
              </Badge>
              <h1 className="mt-3 truncate text-2xl font-extrabold tracking-normal">
                {expense.name}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
                {expense.description || t('expenseDetails.noDescription')}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:min-w-[260px]">
            <p className="text-2xl font-extrabold">
              {formatMoney(
                expense.defaultAmount,
                language,
                appearance.currency,
              )}
            </p>
            <p className="text-sm font-semibold text-[rgb(var(--muted-foreground))]">
              {t('expenses.dueDate', {
                date: formatDate(expense.dueDate, language),
              })}
            </p>
            {currentPayment ? (
              <Button
                type="button"
                variant="secondary"
                disabled={undoPaymentMutation.isPending}
                onClick={() => undoPaymentMutation.mutate()}
              >
                {undoPaymentMutation.isPending ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <Undo2 size={17} />
                )}
                {t('dashboard.undoPayment')}
              </Button>
            ) : isDueInCurrentPeriod ? (
              <Button type="button" onClick={() => setExpenseToMarkPaid(expense)}>
                <Check size={17} />
                {t('dashboard.markPaid')}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard
          title={t('expenseDetails.defaultAmount')}
          value={formatMoney(expense.defaultAmount, language, appearance.currency)}
          icon={CircleDollarSign}
        />
        <MetricCard
          title={t('expenseDetails.paidTotal')}
          value={formatMoney(String(paidTotal), language, appearance.currency)}
          icon={Check}
        />
        <MetricCard
          title={t('expenseDetails.paymentCount')}
          value={String(sortedPayments.length)}
          icon={ReceiptText}
        />
      </section>

      <Card
        className={
          currentPayment
            ? 'border-[#29c776] bg-[#ddfbea] dark:bg-[#153a2b]'
            : !isDueInCurrentPeriod
              ? 'border-[#35b9ff] bg-[#e2f6ff] dark:bg-[#15334a]'
            : 'border-[#ffd45a] bg-[#fff4ce] dark:bg-[#493919]'
        }
      >
        <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={
                currentPayment
                  ? 'grid h-12 w-12 place-items-center rounded-2xl bg-[#29c776] text-white shadow-[0_4px_0_#16a063]'
                  : !isDueInCurrentPeriod
                    ? 'grid h-12 w-12 place-items-center rounded-2xl bg-[#35b9ff] text-white shadow-[0_4px_0_#1688c7]'
                  : 'grid h-12 w-12 place-items-center rounded-2xl bg-[#ffd45a] text-slate-950 shadow-[0_4px_0_#d39d24]'
              }
            >
              {currentPayment ? <Check size={20} /> : <CalendarDays size={20} />}
            </div>
            <div>
              <p className="text-sm font-extrabold">
                {currentPayment
                  ? t('expenseDetails.currentPeriodPaid')
                  : isDueInCurrentPeriod
                    ? t('expenseDetails.currentPeriodOpen')
                    : t('expenseDetails.currentPeriodNotDue')}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted-foreground))]">
                {currentPayment || isDueInCurrentPeriod
                  ? t('expenseDetails.currentPeriodDescription', {
                      period: formatPeriodLabel(currentPeriod, language),
                    })
                  : t('expenseDetails.currentPeriodNotDueDescription', {
                      period: formatPeriodLabel(currentPeriod, language),
                    })}
              </p>
            </div>
          </div>
          {currentPayment ? (
            <p className="text-lg font-extrabold">
              {formatMoney(
                currentPayment.amountSnapshot,
                language,
                appearance.currency,
              )}
            </p>
          ) : isDueInCurrentPeriod ? (
            <Button type="button" onClick={() => setExpenseToMarkPaid(expense)}>
              <Check size={17} />
              {t('dashboard.markPaid')}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('expenseDetails.historyTitle')}</CardTitle>
          <CardDescription>{t('expenseDetails.historyDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {sortedPayments.length ? (
            sortedPayments.map((payment) => (
              <PaymentHistoryLine
                key={payment.id}
                payment={payment}
                language={language}
                currency={appearance.currency}
              />
            ))
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-4 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
              {t('expenseDetails.emptyHistory')}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <span className={`rounded-xl px-3 py-2 text-xs font-extrabold ${periodTone.bg}`}>
          {translateBillingPeriod(expense.billingPeriod, t)}
        </span>
        <span
          className={`rounded-xl px-3 py-2 text-xs font-extrabold ${importanceTone.bg}`}
        >
          {translateImportance(expense.importance, t)}
        </span>
      </div>

      <MarkExpensePaidModal
        expense={expenseToMarkPaid}
        period={currentPeriod}
        onClose={() => setExpenseToMarkPaid(null)}
        onSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: queryKeys.expense(expenseId ?? ''),
          })
        }
      />
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string
  icon: typeof CircleDollarSign
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 text-2xl">{value}</CardTitle>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#35b9ff] text-white shadow-[0_4px_0_#1688c7]">
          <Icon size={19} />
        </div>
      </CardHeader>
    </Card>
  )
}

function PaymentHistoryLine({
  payment,
  language,
  currency,
}: {
  payment: ExpensePayment
  language: string
  currency: Currency
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-3 shadow-[0_3px_0_rgb(var(--border))]">
      <div>
        <p className="text-sm font-extrabold">
          {formatPaymentPeriod(payment, language)}
        </p>
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          {formatDate(payment.paidAt, language)}
        </p>
      </div>
      <p className="text-sm font-extrabold">
        {formatMoney(payment.amountSnapshot, language, currency)}
      </p>
    </div>
  )
}

function formatPaymentPeriod(payment: ExpensePayment, language: string) {
  return new Intl.DateTimeFormat(language, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(payment.periodYear, payment.periodMonth - 1, 1))
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

function translateImportance(
  importance: Expense['importance'],
  t: ReturnType<typeof useI18n>['t'],
) {
  if (importance === 'essential') {
    return t('expenseOptions.importance.essential.label')
  }

  if (importance === 'cancelSoon') {
    return t('expenseOptions.importance.cancelSoon.label')
  }

  return t('expenseOptions.importance.useful.label')
}
