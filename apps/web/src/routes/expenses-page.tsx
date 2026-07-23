import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Loader2,
  MoreVertical,
  Pencil,
  ReceiptText,
  Search,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { z } from 'zod'

import { useAppearance } from '@/app/appearance-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import {
  billingPeriodOptions,
  expenseIconOptions,
  expenseTypeOptions,
  getExpenseIcon,
  importanceOptions,
} from '@/features/expenses/expense-options'
import { useI18n } from '@/i18n/i18n-context'
import type { TranslationKey } from '@/i18n/dictionaries'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/cn'
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

const amountRegex = /^\d{1,8}(\.\d{1,2})?$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

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
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ExpenseFilter>('all')
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const [expenseToArchive, setExpenseToArchive] = useState<Expense | null>(null)
  const expensesQuery = useQuery({
    queryKey: ['expenses'],
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

function createExpenseFormSchema(t: ReturnType<typeof useI18n>['t']) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('expenseForm.nameRequired'))
      .max(255, t('expenseForm.nameMax')),
    defaultAmount: z
      .string()
      .trim()
      .regex(amountRegex, t('expenseForm.amountInvalid')),
    billingPeriod: z.enum(['monthly', 'yearly', 'oneTime']),
    dueDate: z.string().regex(dateRegex, t('expenseForm.dueDateRequired')),
    importance: z.enum(['essential', 'useful', 'cancelSoon']),
    type: z.enum(['subscription', 'utility']),
    icon: z.string().min(1, t('expenseForm.iconRequired')),
    description: z
      .string()
      .trim()
      .max(255, t('expenseForm.descriptionMax'))
      .optional(),
  })
}

type ExpenseFormValues = z.infer<ReturnType<typeof createExpenseFormSchema>>

function EditExpenseModal({
  expense,
  onClose,
}: {
  expense: Expense | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { language, t } = useI18n()
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(createExpenseFormSchema(t)),
    values: expense
      ? {
          name: expense.name,
          defaultAmount: expense.defaultAmount,
          billingPeriod: expense.billingPeriod,
          dueDate: formatDateValue(parseDateValue(expense.dueDate)),
          importance: expense.importance,
          type: expense.type,
          icon: expense.icon,
          description: expense.description ?? '',
        }
      : {
          name: '',
          defaultAmount: '',
          billingPeriod: 'monthly',
          dueDate: formatDateValue(new Date()),
          importance: 'essential',
          type: 'subscription',
          icon: 'receipt',
          description: '',
        },
  })
  const selectedBillingPeriod = form.watch('billingPeriod')

  const updateMutation = useMutation({
    mutationFn: (values: ExpenseFormValues) => {
      if (!expense) {
        throw new Error('Missing expense.')
      }

      return apiRequest<Expense>(`/expenses/${expense.id}`, {
        method: 'PUT',
        body: {
          ...values,
          description: values.description || undefined,
        },
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
      ])
      onClose()
    },
  })

  function handleClose() {
    if (updateMutation.isPending) {
      return
    }

    form.clearErrors()
    onClose()
  }

  return (
    <Modal
      title={t('expenseEdit.title')}
      description={t('expenseEdit.description')}
      isOpen={Boolean(expense)}
      onClose={handleClose}
      closeLabel={t('common.close')}
      className="sm:max-w-3xl"
    >
      <form
        className="grid gap-5"
        onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
      >
        {updateMutation.isError ? (
          <p className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-[rgb(var(--danger))] shadow-[0_4px_0_rgb(253_164_175)] dark:border-rose-500/50 dark:bg-rose-950/30">
            {t('expenseEdit.updateError')}
          </p>
        ) : null}

        <section className="grid gap-4 rounded-3xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-4 shadow-[0_5px_0_rgb(var(--border))]">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_190px]">
            <Field
              label={t('expenseForm.name')}
              htmlFor="edit-expense-name"
              error={form.formState.errors.name?.message}
            >
              <Input
                id="edit-expense-name"
                placeholder={t('expenseForm.namePlaceholder')}
                {...form.register('name')}
              />
            </Field>

            <Field
              label={t('expenseForm.amount')}
              htmlFor="edit-expense-amount"
              error={form.formState.errors.defaultAmount?.message}
            >
              <Input
                id="edit-expense-amount"
                inputMode="decimal"
                placeholder={t('expenseForm.amountPlaceholder')}
                {...form.register('defaultAmount')}
              />
            </Field>
          </div>

          <Controller
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <Field
                label={t('expenseForm.dueDate')}
                htmlFor="edit-expense-due-date"
                error={form.formState.errors.dueDate?.message}
              >
                <DatePicker
                  id="edit-expense-due-date"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('expenseForm.dueDatePlaceholder')}
                  language={language}
                />
                <span className="pl-2 text-xs leading-5 text-[rgb(var(--muted-foreground))]">
                  {t(getDueDateHelpKey(selectedBillingPeriod))}
                </span>
              </Field>
            )}
          />
        </section>

        <section className="grid gap-6 rounded-3xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[0_5px_0_rgb(var(--border))] sm:p-5">
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <OptionGroup
                label={t('expenseForm.type')}
                options={expenseTypeOptions.map((option) => ({
                  value: option.value,
                  label: t(getExpenseTypeLabelKey(option.value)),
                  description: t(getExpenseTypeDescriptionKey(option.value)),
                }))}
                value={field.value}
                onChange={field.onChange}
                columns="two"
              />
            )}
          />

          <Controller
            control={form.control}
            name="billingPeriod"
            render={({ field }) => (
              <OptionGroup
                label={t('expenseForm.period')}
                options={billingPeriodOptions.map((option) => ({
                  value: option.value,
                  label: t(getBillingPeriodLabelKey(option.value)),
                  description: t(getBillingPeriodDescriptionKey(option.value)),
                }))}
                value={field.value}
                onChange={field.onChange}
                columns="three"
              />
            )}
          />

          <Controller
            control={form.control}
            name="importance"
            render={({ field }) => (
              <OptionGroup
                label={t('expenseForm.importance')}
                options={importanceOptions.map((option) => ({
                  value: option.value,
                  label: t(getImportanceLabelKey(option.value)),
                  description: t(getImportanceDescriptionKey(option.value)),
                }))}
                value={field.value}
                onChange={field.onChange}
                columns="three"
              />
            )}
          />
        </section>

        <section className="grid gap-5 rounded-3xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-4 shadow-[0_5px_0_rgb(var(--border))]">
          <Controller
            control={form.control}
            name="icon"
            render={({ field }) => (
              <IconPicker
                value={field.value}
                onChange={field.onChange}
                error={form.formState.errors.icon?.message}
              />
            )}
          />

          <Field
            label={t('expenseForm.descriptionLabel')}
            htmlFor="edit-expense-description"
            error={form.formState.errors.description?.message}
          >
            <Textarea
              id="edit-expense-description"
              placeholder={t('expenseForm.descriptionPlaceholder')}
              {...form.register('description')}
            />
          </Field>
        </section>

        <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 flex items-center justify-end gap-3 border-t-2 border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.94)] px-5 py-4 backdrop-blur">
          <Button
            type="button"
            variant="secondary"
            disabled={updateMutation.isPending}
            onClick={handleClose}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Check size={17} />
            )}
            {t('expenseEdit.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ArchiveExpenseModal({
  expense,
  onClose,
}: {
  expense: Expense | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const archiveMutation = useMutation({
    mutationFn: () => {
      if (!expense) {
        throw new Error('Missing expense.')
      }

      return apiRequest(`/expenses/${expense.id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
      ])
      onClose()
    },
  })

  function handleClose() {
    if (archiveMutation.isPending) {
      return
    }

    onClose()
  }

  return (
    <Modal
      title={t('expenseArchive.title')}
      description={t('expenseArchive.description')}
      isOpen={Boolean(expense)}
      onClose={handleClose}
      closeLabel={t('common.close')}
      className="sm:max-w-xl"
    >
      <div className="grid gap-5">
        {archiveMutation.isError ? (
          <p className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-[rgb(var(--danger))] shadow-[0_4px_0_rgb(253_164_175)] dark:border-rose-500/50 dark:bg-rose-950/30">
            {t('expenseArchive.archiveError')}
          </p>
        ) : null}

        <div className="rounded-3xl border-2 border-[#ff6b7a] bg-[#ffe4e8] p-4 shadow-[0_5px_0_#d64b58] dark:bg-[#4f232c]">
          <p className="text-sm font-extrabold">
            {expense?.name ?? t('expenses.title')}
          </p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
            {t('expenseArchive.body')}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={archiveMutation.isPending}
            onClick={handleClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={archiveMutation.isPending}
            onClick={() => archiveMutation.mutate()}
          >
            {archiveMutation.isPending ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Trash2 size={17} />
            )}
            {t('expenseArchive.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

type OptionGroupProps<TValue extends string> = {
  label: string
  value: TValue
  onChange: (value: TValue) => void
  columns?: 'two' | 'three'
  options: Array<{
    value: TValue
    label: string
    description: string
  }>
}

function OptionGroup<TValue extends string>({
  label,
  value,
  onChange,
  options,
  columns = 'two',
}: OptionGroupProps<TValue>) {
  return (
    <div className="grid gap-3">
      <p className="pl-2 text-sm font-extrabold">{label}</p>
      <div
        className={cn(
          'grid gap-4',
          columns === 'two' && 'sm:grid-cols-2',
          columns === 'three' && 'md:grid-cols-3',
        )}
      >
        {options.map((option) => {
          const isSelected = value === option.value

          return (
            <button
              key={option.value}
              className={cn(
                'h-full min-h-[118px] cursor-pointer rounded-2xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 text-left shadow-[0_5px_0_rgb(var(--border))] transition-colors hover:bg-[rgb(var(--surface-subtle))]',
                isSelected &&
                  'border-[#29c776] bg-[#ddfbea] shadow-[0_5px_0_#16a063] ring-4 ring-white dark:bg-[#153a2b] dark:shadow-[0_5px_0_#0f7f50] dark:ring-slate-950',
              )}
              type="button"
              onClick={() => onChange(option.value)}
            >
              <span className="flex items-center justify-between gap-2 text-sm font-extrabold">
                {option.label}
                {isSelected ? (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#29c776] text-white shadow-[0_2px_0_#16a063]">
                    <Check size={14} />
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-xs leading-5 text-[rgb(var(--muted-foreground))]">
                {option.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function IconPicker({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const { t } = useI18n()

  return (
    <div className="grid gap-3">
      <div>
        <p className="text-sm font-extrabold">{t('expenseForm.icon')}</p>
        <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
          {t('expenseForm.iconDescription')}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
        {expenseIconOptions.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value
          const iconLabel = t(getExpenseIconLabelKey(option.value))
          const tone = getIconTone(option.value)

          return (
            <button
              key={option.value}
              className={cn(
                'group relative grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 bg-[rgb(var(--surface))] text-[rgb(var(--muted-foreground))] shadow-[0_5px_0_rgb(var(--border))] transition-colors hover:bg-[rgb(var(--surface-subtle))]',
                tone.border,
                isSelected &&
                  `${tone.soft} text-[rgb(var(--foreground))] ring-4 ring-white dark:ring-slate-950`,
              )}
              type="button"
              title={iconLabel}
              aria-label={iconLabel}
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
            >
              <span
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-xl',
                  tone.bg,
                  !isSelected && 'opacity-85 group-hover:opacity-100',
                )}
              >
                <Icon size={21} />
              </span>
              {isSelected ? (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[#29c776] text-white shadow-[0_2px_0_#16a063] dark:border-slate-950">
                  <Check size={11} />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      {error ? (
        <span className="text-sm text-[rgb(var(--danger))]">{error}</span>
      ) : null}
    </div>
  )
}

function getBillingPeriodLabelKey(value: BillingPeriod): TranslationKey {
  return `expenseOptions.billing.${value}.label`
}

function getBillingPeriodDescriptionKey(value: BillingPeriod): TranslationKey {
  return `expenseOptions.billing.${value}.description`
}

function getDueDateHelpKey(value: BillingPeriod): TranslationKey {
  return `expenseForm.dueDateHelp.${value}` as TranslationKey
}

function getExpenseTypeLabelKey(value: ExpenseType): TranslationKey {
  return `expenseOptions.type.${value}.label`
}

function getExpenseTypeDescriptionKey(value: ExpenseType): TranslationKey {
  return `expenseOptions.type.${value}.description`
}

function getImportanceLabelKey(value: Expense['importance']): TranslationKey {
  return `expenseOptions.importance.${value}.label`
}

function getImportanceDescriptionKey(
  value: Expense['importance'],
): TranslationKey {
  return `expenseOptions.importance.${value}.description`
}

function getExpenseIconLabelKey(value: string): TranslationKey {
  return `expenseIcons.${value}` as TranslationKey
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
