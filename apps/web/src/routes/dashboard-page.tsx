import { useQuery } from '@tanstack/react-query'
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Sparkles } from 'lucide-react'

import { useAppearance } from '@/app/appearance-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getExpenseIcon } from '@/features/expenses/expense-options'
import { useI18n } from '@/i18n/i18n-context'
import { apiRequest } from '@/lib/api'
import type { Currency, DashboardSummary, Expense } from '@/lib/types'
import { getIconTone, visualTones } from '@/lib/visuals'
import lightJumbotronImage from '@/assets/calm-finance-hero.jpg'
import darkJumbotronImage from '@/assets/tokyo-finance-jumbotron.jpg'

function getCurrentPeriod() {
  const now = new Date()

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }
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

export function DashboardPage() {
  const { language, t } = useI18n()
  const { appearance } = useAppearance()
  const period = getCurrentPeriod()
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary', period.year, period.month],
    queryFn: () =>
      apiRequest<DashboardSummary>(
        `/dashboard/summary?periodMonth=${period.month}&periodYear=${period.year}`,
      ),
  })

  const summary = summaryQuery.data

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl border-2 border-[#b8d5ee] bg-white shadow-[0_8px_0_#b8d5ee] dark:border-[#3f5180] dark:bg-slate-950 dark:shadow-[0_8px_0_#27375f]">
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
        <div className="absolute inset-0 bg-gradient-to-r from-white/98 via-white/82 to-white/10 dark:from-slate-950/94 dark:via-slate-950/70 dark:to-slate-950/18" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/72 via-transparent to-transparent dark:from-slate-950/82" />

        <div className="relative grid min-h-[360px] gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.92fr)_340px] lg:items-end">
          <div className="self-center">
            <h1 className="max-w-xl text-4xl font-extrabold tracking-normal text-slate-950 dark:text-white sm:text-5xl">
              {t('dashboard.title')}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-700 dark:text-slate-200 sm:text-base">
              {t('dashboard.description')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
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

          <div className="grid gap-3 rounded-2xl border-2 border-[#35b9ff] bg-white/86 p-4 text-slate-950 shadow-[0_7px_0_#35b9ff] backdrop-blur-md dark:border-cyan-300/35 dark:bg-slate-950/72 dark:text-white dark:shadow-[0_7px_0_#164e75]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffd45a] text-slate-950 shadow-[0_4px_0_#d39d24]">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-950 dark:text-white">
                  {summary
                    ? formatMoney(
                        summary.totals.projected,
                        language,
                        appearance.currency,
                      )
                    : '...'}
                </p>
                <p className="text-xs text-slate-600 dark:text-cyan-100">
                  {t('dashboard.metric.plannedDescription')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-1">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 rounded-md bg-gradient-to-t from-[#35b9ff] to-[#29c776] shadow-sm dark:from-cyan-400 dark:to-fuchsia-400"
                  style={{ opacity: 0.35 + index * 0.045 }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title={t('dashboard.metric.planned')}
          value={
            summary
              ? formatMoney(summary.totals.planned, language, appearance.currency)
              : '...'
          }
          description={t('dashboard.metric.plannedDescription')}
          icon={CircleDollarSign}
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
          icon={ArrowUpRight}
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
          icon={ArrowDownRight}
          tone={visualTones[3]}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
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
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 text-2xl">{value}</CardTitle>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-md ${tone.bg}`}>
          <Icon size={19} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

function ExpenseLine({
  expense,
  amount,
  meta,
}: {
  expense: Expense
  amount: string
  meta: string
}) {
  const Icon = getExpenseIcon(expense.icon)
  const tone = getIconTone(expense.icon)

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-3 shadow-[0_4px_0_rgb(var(--border))]">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone.bg}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
        <p className="truncate text-sm font-extrabold">{expense.name}</p>
        <p className="text-xs text-[rgb(var(--muted-foreground))]">{meta}</p>
        </div>
      </div>
      <p className="shrink-0 text-sm font-extrabold">{amount}</p>
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
