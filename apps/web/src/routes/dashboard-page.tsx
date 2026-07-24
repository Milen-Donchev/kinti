import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  Check,
  ClipboardList,
  CircleDollarSign,
  Clock3,
  Loader2,
  Undo2,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { useAppearance } from '@/app/appearance-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getExpenseIcon } from '@/features/expenses/expense-options'
import { MarkExpensePaidModal } from '@/features/expenses/mark-expense-paid-modal'
import { useI18n } from '@/i18n/i18n-context'
import { apiRequest } from '@/lib/api'
import { undoPaymentInCache } from '@/lib/query-cache-updates'
import { queryKeys } from '@/lib/query-keys'
import type { Currency, DashboardSummary, ExpenseSummary } from '@/lib/types'
import { getIconTone, visualTones } from '@/lib/visuals'
import lightJumbotronImage from '@/assets/calm-finance-hero.jpg'
import darkJumbotronImage from '@/assets/tokyo-finance-jumbotron.jpg'
import dashboardMascotImage from '@/assets/mascots/levko-dashboard-mascot-ui.png'

function getCurrentPeriod() {
  const now = new Date()

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }
}

function formatMonthLabel(month: number, language: string) {
  return new Intl.DateTimeFormat(language, {
    month: 'long',
  }).format(new Date(2026, month - 1, 1))
}

const yearOptions = Array.from({ length: 101 }, (_, index) => 1950 + index)

function getInitialYearScrollOffset(year: number) {
  const itemHeight = 44
  const visibleItemsBeforeSelected = 3
  const yearIndex = yearOptions.indexOf(year)

  if (yearIndex < 0) {
    return 0
  }

  return Math.max((yearIndex - visibleItemsBeforeSelected) * itemHeight, 0)
}

const currencyCodes: Record<Currency, string> = {
  eur: 'EUR',
  usd: 'USD',
  gbp: 'GBP',
}

function formatMoney(value: string, language: string, currency: Currency) {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: currencyCodes[currency] ?? currencyCodes.eur,
  }).format(Number(value))
}

function getMonthlyProgress(summary: DashboardSummary | undefined) {
  if (!summary) {
    return 0
  }

  const planned = Number(summary.totals.planned)
  const paid = Number(summary.totals.paid)

  if (!Number.isFinite(planned) || planned <= 0) {
    return summary.counts.total > 0
      ? (summary.counts.paid / summary.counts.total) * 100
      : 0
  }

  return Math.min((paid / planned) * 100, 100)
}

function PeriodPickerButton({
  label,
  value,
  clearLabel,
  hasCustomValue,
  onClear,
  children,
}: {
  label: string
  value: string
  clearLabel: string
  hasCustomValue: boolean
  onClear: () => void
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="relative min-w-0">
        <PopoverTrigger asChild>
          <Button
            className="h-12 w-full justify-start rounded-2xl border-[#35b9ff] bg-white/92 pl-3 pr-8 text-left normal-case tracking-normal text-slate-950 shadow-[0_4px_0_#35b9ff] backdrop-blur dark:border-cyan-300/35 dark:bg-slate-950/80 dark:text-white dark:shadow-[0_4px_0_#164e75]"
            type="button"
            variant="secondary"
          >
            <CalendarDays size={15} />
            <span className="min-w-0">
              <span className="block text-[10px] leading-none text-slate-500 dark:text-cyan-100">
                {label}
              </span>
              <span className="mt-1 block truncate text-xs">{value}</span>
            </span>
          </Button>
        </PopoverTrigger>
        {hasCustomValue ? (
          <button
            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 cursor-pointer place-items-center rounded-lg border-2 border-[#ff6b7a] bg-[#ffe4e8] text-[#d64b58] shadow-[0_2px_0_#ff6b7a] transition-colors hover:brightness-105 dark:bg-pink-400/18 dark:text-pink-100"
            type="button"
            aria-label={clearLabel}
            onClick={onClear}
          >
            <X size={13} />
          </button>
        ) : null}
      </div>
      <PopoverContent
        className="w-[22rem] max-w-[calc(100vw-2rem)]"
        align="start"
        onClick={() => setIsOpen(false)}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

function YearPickerOptions({
  selectedYear,
  onSelect,
}: {
  selectedYear: number
  onSelect: (year: number) => void
}) {
  return (
    <div
      className="grid max-h-72 gap-2 overflow-y-auto pr-1"
      ref={(node) => {
        if (node) {
          node.scrollTop = getInitialYearScrollOffset(selectedYear)
        }
      }}
    >
      {yearOptions.map((year) => (
        <Button
          key={year}
          className="h-9 min-w-28 justify-start whitespace-nowrap px-3 text-[11px] normal-case tracking-normal"
          type="button"
          variant={selectedYear === year ? 'primary' : 'ghost'}
          onClick={() => onSelect(year)}
        >
          {year}
        </Button>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const { language, t } = useI18n()
  const { appearance } = useAppearance()
  const [expenseToMarkPaid, setExpenseToMarkPaid] =
    useState<ExpenseSummary | null>(null)
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState(getCurrentPeriod)
  const currentPeriod = getCurrentPeriod()
  const summaryQuery = useQuery({
    queryKey: queryKeys.dashboardSummary(period),
    queryFn: () =>
      apiRequest<DashboardSummary>(
        `/dashboard/summary?periodMonth=${period.month}&periodYear=${period.year}`,
      ),
  })

  const summary = summaryQuery.data
  const monthlyProgress = getMonthlyProgress(summary)
  const undoPaymentMutation = useMutation({
    mutationFn: (expenseId: string) =>
      apiRequest(
        `/payments/expenses/${expenseId}?periodMonth=${period.month}&periodYear=${period.year}`,
        {
          method: 'DELETE',
        },
      ),
    onMutate: async (expenseId) => {
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: queryKeys.dashboardSummary(period),
        }),
        queryClient.cancelQueries({
          queryKey: queryKeys.payments(period),
        }),
      ])
      undoPaymentInCache(queryClient, period, expenseId)
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardSummary(period),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.payments(period),
        }),
      ])
    },
  })

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="relative min-h-[300px] overflow-hidden rounded-3xl border-2 border-[#b8d5ee] bg-white shadow-[0_8px_0_#b8d5ee] dark:border-[#3f5180] dark:bg-slate-950 dark:shadow-[0_8px_0_#27375f]">
          <img
            className="absolute inset-0 h-full w-full object-cover dark:hidden"
            src={lightJumbotronImage}
            alt=""
          />
          <img
            className="absolute inset-0 hidden h-full w-full object-cover dark:block"
            src={darkJumbotronImage}
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/98 via-white/84 to-white/28 dark:from-slate-950/94 dark:via-slate-950/74 dark:to-slate-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/74 via-transparent to-transparent dark:from-slate-950/84" />
          <img
            className="pointer-events-none absolute -right-4 bottom-0 z-10 hidden h-52 w-auto drop-shadow-[0_12px_0_rgba(11,37,69,0.18)] md:block lg:h-60 xl:-right-2 xl:h-64"
            src={dashboardMascotImage}
            alt=""
          />

          <div className="relative z-20 flex min-h-[300px] flex-col justify-between gap-8 p-5 sm:p-6 md:pr-56 lg:p-7 lg:pr-64 xl:pr-72">
            <div className="pt-3 sm:pt-5">
              <h1 className="max-w-xl text-3xl font-extrabold tracking-normal text-slate-950 dark:text-white sm:text-4xl">
                {t('dashboard.title')}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-700 dark:text-slate-200 sm:text-base">
                {t('dashboard.description')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-xl border-2 border-[#b8d5ee] bg-white px-3 py-2 text-sm font-extrabold text-slate-900 shadow-[0_4px_0_#b8d5ee] dark:border-white/20 dark:bg-white/12 dark:text-white dark:shadow-none">
                {t('dashboard.hero.total', { count: summary?.counts.total ?? 0 })}
              </span>
              <span className="rounded-xl border-2 border-[#29c776] bg-[#ddfbea] px-3 py-2 text-sm font-extrabold text-[#16a063] shadow-[0_4px_0_#29c776] dark:bg-emerald-400/18 dark:text-emerald-100 dark:shadow-none">
                {t('dashboard.hero.paid', { count: summary?.counts.paid ?? 0 })}
              </span>
              <span className="rounded-xl border-2 border-[#ff6b7a] bg-[#ffe4e8] px-3 py-2 text-sm font-extrabold text-[#d64b58] shadow-[0_4px_0_#ff6b7a] dark:bg-pink-400/18 dark:text-pink-100 dark:shadow-none">
                {t('dashboard.hero.open', { count: summary?.counts.unpaid ?? 0 })}
              </span>
            </div>
          </div>
        </div>

        <div className="relative min-h-[300px] overflow-hidden rounded-3xl border-2 border-[#35b9ff] bg-[#e2f6ff] p-4 shadow-[0_8px_0_#1688c7] dark:border-cyan-300/35 dark:bg-[#08152b] dark:shadow-[0_8px_0_#164e75] sm:p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,212,90,0.40),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(183,125,255,0.36),transparent_32%),linear-gradient(145deg,rgba(255,255,255,0.72),rgba(53,185,255,0.14))] dark:bg-[radial-gradient(circle_at_18%_8%,rgba(53,185,255,0.26),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(255,107,122,0.22),transparent_32%),linear-gradient(145deg,rgba(8,21,43,0.92),rgba(8,21,43,0.54))]" />
          <div className="relative grid h-full min-h-[268px] content-between gap-3">
            <div className="relative z-20 grid grid-cols-2 gap-2">
              <PeriodPickerButton
                label={t('dashboard.monthPicker')}
                value={formatMonthLabel(period.month, language)}
                clearLabel={t('dashboard.clearMonth')}
                hasCustomValue={period.month !== currentPeriod.month}
                onClear={() =>
                  setPeriod((current) => ({
                    ...current,
                    month: currentPeriod.month,
                  }))
                }
              >
                <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(
                    (month) => (
                      <Button
                        key={month}
                        className="h-9 min-w-36 justify-start whitespace-nowrap px-3 text-[11px] normal-case tracking-normal"
                        type="button"
                        variant={period.month === month ? 'primary' : 'ghost'}
                        onClick={() =>
                          setPeriod((current) => ({
                            ...current,
                            month,
                          }))
                        }
                      >
                        {formatMonthLabel(month, language)}
                      </Button>
                    ),
                  )}
                </div>
              </PeriodPickerButton>
              <PeriodPickerButton
                label={t('dashboard.yearPicker')}
                value={String(period.year)}
                clearLabel={t('dashboard.clearYear')}
                hasCustomValue={period.year !== currentPeriod.year}
                onClear={() =>
                  setPeriod((current) => ({
                    ...current,
                    year: currentPeriod.year,
                  }))
                }
              >
                <YearPickerOptions
                  selectedYear={period.year}
                  onSelect={(year) =>
                    setPeriod((current) => ({
                      ...current,
                      year,
                    }))
                  }
                />
              </PeriodPickerButton>
            </div>

            <div className="relative z-20 overflow-hidden rounded-2xl border-2 border-[#35b9ff] bg-white/90 p-4 text-slate-950 shadow-[0_7px_0_#35b9ff] backdrop-blur-md dark:border-cyan-300/35 dark:bg-slate-950/82 dark:text-white dark:shadow-[0_7px_0_#164e75]">
              <div className="relative">
                <p className="text-xs font-extrabold uppercase text-[#1688c7] dark:text-cyan-200">
                  {t('dashboard.progressTitle')}
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-950 dark:text-white">
                  {Math.round(monthlyProgress)}%
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-cyan-100">
                  {t('dashboard.progressDescription', {
                    paid: summary?.counts.paid ?? 0,
                    total: summary?.counts.total ?? 0,
                  })}
                </p>
              </div>
              <div className="relative mt-5 h-5 overflow-hidden rounded-full border-2 border-[#0b2545] bg-[#e2f6ff] shadow-[0_3px_0_#0b2545] dark:border-cyan-200/35 dark:bg-slate-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#29c776] via-[#35b9ff] to-[#ffd45a] transition-[width] duration-500"
                  style={{ width: `${monthlyProgress}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border-2 border-[#29c776] bg-[#ddfbea] px-3 py-2 font-extrabold text-[#16a063] dark:bg-emerald-400/18 dark:text-emerald-100">
                  <p>{t('dashboard.metric.paid')}</p>
                  <p className="mt-1 text-sm">
                    {summary
                      ? formatMoney(
                          summary.totals.paid,
                          language,
                          appearance.currency,
                        )
                      : '...'}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-[#ff6b7a] bg-[#ffe4e8] px-3 py-2 font-extrabold text-[#d64b58] dark:bg-pink-400/18 dark:text-pink-100">
                  <p>{t('dashboard.metric.remaining')}</p>
                  <p className="mt-1 text-sm">
                    {summary
                      ? formatMoney(
                          summary.totals.remaining,
                          language,
                          appearance.currency,
                        )
                      : '...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard
          title={t('dashboard.metric.planned')}
          value={
            summary
              ? formatMoney(summary.totals.planned, language, appearance.currency)
              : '...'
          }
          description={t('dashboard.metric.plannedDescription')}
          icon={ClipboardList}
          tone={visualTones[1]}
        />
        <MetricCard
          title={t('dashboard.metric.paid')}
          value={
            summary
              ? formatMoney(summary.totals.paid, language, appearance.currency)
              : '...'
          }
          description={t('dashboard.metric.paidDescription', {
            count: summary?.counts.paid ?? 0,
          })}
          icon={Check}
          tone={visualTones[0]}
        />
        <MetricCard
          title={t('dashboard.metric.remaining')}
          value={
            summary
              ? formatMoney(
                  summary.totals.remaining,
                  language,
                  appearance.currency,
                )
              : '...'
          }
          description={t('dashboard.metric.remainingDescription', {
            count: summary?.counts.unpaid ?? 0,
          })}
          icon={Clock3}
          tone={visualTones[3]}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.remainingTitle')}</CardTitle>
            <CardDescription>{t('dashboard.remainingDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {summaryQuery.isLoading ? (
              <EmptyLine text={t('dashboard.loadingExpenses')} />
            ) : null}
            {summary?.unpaidExpenses.length ? (
              summary.unpaidExpenses.slice(0, 5).map((item) => (
                <ExpenseLine
                  key={item.expense.id}
                  expense={item.expense}
                  amount={formatMoney(
                    item.expectedAmount,
                    language,
                    appearance.currency,
                  )}
                  meta={item.expense.type}
                  actionLabel={t('dashboard.markPaid')}
                  onAction={() => setExpenseToMarkPaid(item.expense)}
                />
              ))
            ) : null}
            {summary && summary.unpaidExpenses.length === 0 ? (
              <EmptyLine text={t('dashboard.allPaid')} />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.paidTitle')}</CardTitle>
            <CardDescription>{t('dashboard.paidDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {summaryQuery.isLoading ? (
              <EmptyLine text={t('dashboard.loadingPayments')} />
            ) : null}
            {summary?.paidExpenses.length ? (
              summary.paidExpenses.slice(0, 5).map((item) => (
                <ExpenseLine
                  key={item.payment.id}
                  expense={item.expense}
                  amount={formatMoney(item.amount, language, appearance.currency)}
                  meta={t('dashboard.meta.paid')}
                  actionLabel={t('dashboard.undoPayment')}
                  actionIcon="undo"
                  actionVariant="secondary"
                  isActionPending={undoPaymentMutation.isPending}
                  onAction={() => undoPaymentMutation.mutate(item.expense.id)}
                />
              ))
            ) : null}
            {summary && summary.paidExpenses.length === 0 ? (
              <EmptyLine text={t('dashboard.noPaid')} />
            ) : null}
          </CardContent>
        </Card>
      </section>

      {summaryQuery.isError ? (
        <p className="rounded-md bg-[rgb(var(--danger)/0.08)] p-3 text-sm text-[rgb(var(--danger))]">
          {t('dashboard.loadError')}
        </p>
      ) : null}

      <MarkExpensePaidModal
        expense={expenseToMarkPaid}
        period={period}
        onClose={() => setExpenseToMarkPaid(null)}
      />
    </div>
  )
}

type MetricCardProps = {
  title: string
  value: string
  description: string
  icon: typeof CircleDollarSign
  tone: (typeof visualTones)[number]
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: MetricCardProps) {
  return (
    <Card className={`overflow-hidden ${tone.soft} ${tone.border}`}>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone.bg}`}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <CardDescription className="text-xs">{title}</CardDescription>
          <CardTitle className="mt-1 truncate text-xl leading-tight">
            {value}
          </CardTitle>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[rgb(var(--muted-foreground))]">
            {description}
          </p>
        </div>
      </CardHeader>
    </Card>
  )
}

function ExpenseLine({
  expense,
  amount,
  meta,
  actionLabel,
  actionIcon = 'check',
  actionVariant = 'primary',
  isActionPending,
  onAction,
}: {
  expense: ExpenseSummary
  amount: string
  meta: string
  actionLabel?: string
  actionIcon?: 'check' | 'undo'
  actionVariant?: 'primary' | 'secondary'
  isActionPending?: boolean
  onAction?: () => void
}) {
  const Icon = getExpenseIcon(expense.icon)
  const tone = getIconTone(expense.icon)
  const ActionIcon = actionIcon === 'undo' ? Undo2 : Check

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-3 shadow-[0_4px_0_rgb(var(--border))] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone.bg}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
        <p className="truncate text-sm font-extrabold">{expense.name}</p>
        <p className="text-xs text-[rgb(var(--muted-foreground))]">{meta}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
        <p className="text-sm font-extrabold">{amount}</p>
        {onAction && actionLabel ? (
          <Button
            className="h-9 px-3 text-xs"
            type="button"
            variant={actionVariant}
            disabled={isActionPending}
            onClick={onAction}
          >
            {isActionPending ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <ActionIcon size={14} />
            )}
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function EmptyLine({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle)/0.6)] px-3 py-4 text-sm text-[rgb(var(--muted-foreground))]">
      {text}
    </div>
  )
}
