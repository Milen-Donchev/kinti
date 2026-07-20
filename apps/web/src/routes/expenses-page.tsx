import { useQuery } from '@tanstack/react-query'
import { ReceiptText } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'

import { useAppearance } from '@/app/appearance-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getExpenseIcon } from '@/features/expenses/expense-options'
import { useI18n } from '@/i18n/i18n-context'
import { apiRequest } from '@/lib/api'
import type { BillingPeriod, Currency, Expense, ExpenseType } from '@/lib/types'
import {
  getBillingPeriodTone,
  getExpenseTypeTone,
  getIconTone,
} from '@/lib/visuals'

type AppShellOutletContext = {
  openAddExpenseModal: () => void
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

function formatDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
  }).format(parseDateValue(value))
}

function parseDateValue(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)

  return new Date(year, month - 1, day)
}

export function ExpensesPage() {
  const { language, t } = useI18n()
  const { appearance } = useAppearance()
  const { openAddExpenseModal } = useOutletContext<AppShellOutletContext>()
  const expensesQuery = useQuery({
    queryKey: ['expenses'],
    queryFn: () => apiRequest<Expense[]>('/expenses'),
  })

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-3xl border-2 border-[#35b9ff] bg-[#e2f6ff] p-5 shadow-[0_7px_0_#35b9ff] dark:bg-[#15334a]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge className="border-2 border-[#35b9ff] bg-white text-[#1688c7] shadow-[0_3px_0_#35b9ff] dark:bg-slate-950 dark:text-cyan-200">
            <ReceiptText size={13} className="mr-1" />
            {t('expenses.badge')}
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold">{t('expenses.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--muted-foreground))]">
            {t('expenses.description')}
          </p>
        </div>
        <Button onClick={openAddExpenseModal}>
          <ReceiptText size={17} />
          {t('common.addExpense')}
        </Button>
      </div>
      </section>

      {expensesQuery.isLoading ? (
        <Card>
          <CardContent className="pt-5 text-sm text-[rgb(var(--muted-foreground))]">
            {t('expenses.loading')}
          </CardContent>
        </Card>
      ) : null}

      {expensesQuery.data?.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {expensesQuery.data.map((expense) => {
            const Icon = getExpenseIcon(expense.icon)
            const iconTone = getIconTone(expense.icon)
            const periodTone = getBillingPeriodTone(expense.billingPeriod)
            const typeTone = getExpenseTypeTone(expense.type)

            return (
              <Card
                key={expense.id}
                className={`relative overflow-hidden ${iconTone.soft} ${iconTone.border} ${iconTone.glow} transition-transform hover:-translate-y-1`}
              >
                <div className={`h-1.5 ${iconTone.bg}`} />
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className={`grid h-12 w-12 place-items-center rounded-lg ${iconTone.bg}`}>
                      <Icon size={22} />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className={`rounded-sm px-2 py-1 text-xs font-medium ${typeTone.bg}`}>
                        {translateExpenseType(expense.type, t)}
                      </span>
                      <span className={`rounded-sm px-2 py-1 text-xs font-medium ${periodTone.bg}`}>
                        {translateBillingPeriod(expense.billingPeriod, t)}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="pt-1">{expense.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {formatMoney(
                      expense.defaultAmount,
                      language,
                      appearance.currency,
                    )}
                  </p>
                  {expense.description ? (
                    <p className="mt-3 text-sm text-[rgb(var(--muted-foreground))]">
                      {expense.description}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-[rgb(var(--muted-foreground))]">
                    {t('expenses.dueDate', {
                      date: formatDate(expense.dueDate, language),
                    })}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </section>
      ) : null}

      {expensesQuery.data && expensesQuery.data.length === 0 ? (
        <Card className="overflow-hidden border-[#35b9ff] bg-[#e2f6ff] dark:bg-[#15334a]">
          <CardContent className="grid place-items-center gap-4 py-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#35b9ff] text-white shadow-[0_5px_0_#1688c7]">
              <ReceiptText size={22} />
            </div>
            <div>
              <h2 className="font-semibold">{t('expenses.emptyTitle')}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[rgb(var(--muted-foreground))]">
                {t('expenses.emptyDescription')}
              </p>
            </div>
            <Button onClick={openAddExpenseModal}>
              <ReceiptText size={17} />
              {t('common.addExpense')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {expensesQuery.isError ? (
        <p className="rounded-md bg-[rgb(var(--danger)/0.08)] p-3 text-sm text-[rgb(var(--danger))]">
          {t('expenses.loadError')}
        </p>
      ) : null}
    </div>
  )
}

function translateExpenseType(
  type: ExpenseType,
  t: ReturnType<typeof useI18n>['t'],
) {
  return t(type === 'subscription' ? 'expenses.type.subscription' : 'expenses.type.utility')
}

function translateBillingPeriod(
  period: BillingPeriod,
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
