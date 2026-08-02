import { useQuery } from '@tanstack/react-query'
import {
  MoreVertical,
  Pencil,
  ReceiptText,
  Search,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import { useAppearance } from '@/app/appearance-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  ArchiveExpenseModal,
  EditExpenseModal,
} from '@/features/expenses/expense-management-modals'
import {
  getExpenseIcon,
} from '@/features/expenses/expense-options'
import { useI18n } from '@/i18n/i18n-context'
import type { TranslationKey } from '@/i18n/dictionaries'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/cn'
import { parseDateValue } from '@/lib/expense-schedule'
import { queryKeys } from '@/lib/query-keys'
import type { BillingPeriod, Currency, Expense, ExpenseType } from '@/lib/types'
import {
  getBillingPeriodTone,
  getExpenseTypeTone,
  getIconTone,
  getImportanceTone,
} from '@/lib/visuals'

type AppShellOutletContext = {
  openAddExpenseModal: () => void
}

type ExpenseFilter = 'all' | 'subscription' | 'utility' | 'oneTime'

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

export function ExpensesPage() {
  const { language, t } = useI18n()
  const { appearance } = useAppearance()
  const { openAddExpenseModal } = useOutletContext<AppShellOutletContext>()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ExpenseFilter>('all')
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const [expenseToArchive, setExpenseToArchive] = useState<Expense | null>(null)
  const expensesQuery = useQuery({
    queryKey: queryKeys.expenses(),
    queryFn: () => apiRequest<Expense[]>('/expenses'),
  })
  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return (expensesQuery.data ?? []).filter((expense) => {
      const matchesSearch =
        !query ||
        expense.name.toLowerCase().includes(query) ||
        (expense.description?.toLowerCase().includes(query) ?? false)

      const matchesFilter =
        activeFilter === 'all' ||
        expense.type === activeFilter ||
        expense.billingPeriod === activeFilter

      return matchesSearch && matchesFilter
    })
  }, [activeFilter, expensesQuery.data, searchQuery])

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-3xl border-2 border-[#35b9ff] bg-[#e2f6ff] p-4 shadow-[0_6px_0_#35b9ff] dark:bg-[#15334a]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge className="border-2 border-[#35b9ff] bg-white text-[#1688c7] shadow-[0_3px_0_#35b9ff] dark:bg-slate-950 dark:text-cyan-200">
              <ReceiptText size={13} className="mr-1" />
              {t('expenses.badge')}
            </Badge>
            <h1 className="mt-3 text-2xl font-extrabold tracking-normal">
              {t('expenses.title')}
            </h1>
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

      <section className="grid gap-3 rounded-2xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[0_4px_0_rgb(var(--border))]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]"
            size={18}
          />
          <Input
            className="pl-11"
            value={searchQuery}
            placeholder={t('expenses.searchPlaceholder')}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {expenseFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={cn(
                'cursor-pointer rounded-xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-xs font-extrabold shadow-[0_3px_0_rgb(var(--border))] transition-colors hover:bg-[rgb(var(--surface-subtle))]',
                activeFilter === filter &&
                  'border-[#29c776] bg-[#ddfbea] text-[#16a063] shadow-[0_3px_0_#16a063] dark:bg-[#153a2b] dark:text-[#36d887] dark:shadow-[0_3px_0_#0f7f50]',
              )}
              onClick={() => setActiveFilter(filter)}
            >
              {t(getExpenseFilterLabelKey(filter))}
            </button>
          ))}
        </div>
      </section>

      {expensesQuery.isLoading ? (
        <Card>
          <CardContent className="pt-5 text-sm text-[rgb(var(--muted-foreground))]">
            {t('expenses.loading')}
          </CardContent>
        </Card>
      ) : null}

      {expensesQuery.data?.length && filteredExpenses.length ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {filteredExpenses.map((expense) => {
            const Icon = getExpenseIcon(expense.icon)
            const iconTone = getIconTone(expense.icon)
            const periodTone = getBillingPeriodTone(expense.billingPeriod)
            const typeTone = getExpenseTypeTone(expense.type)
            const importanceTone = getImportanceTone(expense.importance)

            return (
              <Card
                key={expense.id}
                className={`relative cursor-pointer overflow-hidden rounded-2xl shadow-[0_4px_0_rgb(var(--border))] ${iconTone.soft} ${iconTone.border} ${iconTone.glow} transition-colors`}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/expenses/${expense.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    navigate(`/expenses/${expense.id}`)
                  }
                }}
              >
                <div className={`h-1 ${iconTone.bg}`} />
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconTone.bg}`}>
                      <Icon size={19} />
                    </div>
                    <div onClick={(event) => event.stopPropagation()}>
                      <ExpenseActionsMenu
                        onEdit={() => setExpenseToEdit(expense)}
                        onArchive={() => setExpenseToArchive(expense)}
                      />
                    </div>
                  </div>
                  <CardTitle className="pt-1 text-base leading-5">
                    {expense.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xl font-extrabold">
                    {formatMoney(
                      expense.defaultAmount,
                      language,
                      appearance.currency,
                    )}
                  </p>
                  {expense.description ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[rgb(var(--muted-foreground))]">
                      {expense.description}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs font-semibold text-[rgb(var(--muted-foreground))]">
                    {t('expenses.dueDate', {
                      date: formatDate(expense.dueDate, language),
                    })}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-lg px-2 py-1 text-[11px] font-extrabold ${typeTone.bg}`}>
                      {translateExpenseType(expense.type, t)}
                    </span>
                    <span className={`rounded-lg px-2 py-1 text-[11px] font-extrabold ${periodTone.bg}`}>
                      {translateBillingPeriod(expense.billingPeriod, t)}
                    </span>
                    <span className={`rounded-lg px-2 py-1 text-[11px] font-extrabold ${importanceTone.bg}`}>
                      {translateImportance(expense.importance, t)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>
      ) : null}

      {expensesQuery.data?.length && filteredExpenses.length === 0 ? (
        <Card className="overflow-hidden border-[#ffd45a] bg-[#fff4ce] dark:bg-[#493919]">
          <CardContent className="grid place-items-center gap-3 py-10 text-center">
            <Search size={24} className="text-[#8a6414] dark:text-[#ffd45a]" />
            <div>
              <h2 className="font-extrabold">{t('expenses.noMatchesTitle')}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[rgb(var(--muted-foreground))]">
                {t('expenses.noMatchesDescription')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {expensesQuery.data && expensesQuery.data.length === 0 ? (
        <Card className="overflow-hidden border-[#35b9ff] bg-[#e2f6ff] dark:bg-[#15334a]">
          <CardContent className="grid place-items-center gap-4 py-10 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#35b9ff] text-white shadow-[0_5px_0_#1688c7]">
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

      <EditExpenseModal
        expense={expenseToEdit}
        onClose={() => setExpenseToEdit(null)}
      />
      <ArchiveExpenseModal
        expense={expenseToArchive}
        onClose={() => setExpenseToArchive(null)}
      />
    </div>
  )
}

const expenseFilters: ExpenseFilter[] = [
  'all',
  'subscription',
  'utility',
  'oneTime',
]

function getExpenseFilterLabelKey(filter: ExpenseFilter): TranslationKey {
  return `expenses.filter.${filter}` as TranslationKey
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

function translateImportance(
  importance: Expense['importance'],
  t: ReturnType<typeof useI18n>['t'],
) {
  return t(getImportanceLabelKey(importance))
}

function ExpenseActionsMenu({
  onEdit,
  onArchive,
}: {
  onEdit: () => void
  onArchive: () => void
}) {
  const { t } = useI18n()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-9 w-9 rounded-xl px-0 shadow-[0_3px_0_rgb(var(--border))]"
          type="button"
          variant="secondary"
          aria-label={t('expenses.actions')}
        >
          <MoreVertical size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="grid w-44 gap-2 p-2">
        <button
          className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-extrabold text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-subtle))]"
          type="button"
          onClick={onEdit}
        >
          <Pencil size={15} />
          {t('expenses.edit')}
        </button>
        <button
          className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-extrabold text-[rgb(var(--danger))] hover:bg-rose-50 dark:hover:bg-rose-950/30"
          type="button"
          onClick={onArchive}
        >
          <Trash2 size={15} />
          {t('expenses.archive')}
        </button>
      </PopoverContent>
    </Popover>
  )
}

function getImportanceLabelKey(value: Expense['importance']): TranslationKey {
  return `expenseOptions.importance.${value}.label`
}
