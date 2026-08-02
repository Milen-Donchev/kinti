import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import {
  billingPeriodOptions,
  expenseIconOptions,
  expenseTypeOptions,
  importanceOptions,
} from '@/features/expenses/expense-options'
import { useI18n } from '@/i18n/i18n-context'
import type { TranslationKey } from '@/i18n/dictionaries'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/cn'
import { formatDateValue, parseDateValue } from '@/lib/expense-schedule'
import {
  removeExpenseFromListCache,
  updateExpenseInCache,
} from '@/lib/query-cache-updates'
import { queryKeys } from '@/lib/query-keys'
import type { BillingPeriod, Expense, ExpenseType } from '@/lib/types'
import { getIconTone } from '@/lib/visuals'

const amountRegex = /^\d{1,8}(\.\d{1,2})?$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

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

export function EditExpenseModal({
  expense,
  onClose,
  onUpdated,
}: {
  expense: Expense | null
  onClose: () => void
  onUpdated?: (expense: Expense) => void
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
    onSuccess: async (updatedExpense) => {
      updateExpenseInCache(queryClient, updatedExpense)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.expensesDueAll() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardSummaries(),
        }),
      ])
      onUpdated?.(updatedExpense)
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

export function ArchiveExpenseModal({
  expense,
  onClose,
  onArchived,
}: {
  expense: Expense | null
  onClose: () => void
  onArchived?: (expense: Expense) => void
}) {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const archiveMutation = useMutation({
    mutationFn: () => {
      if (!expense) {
        throw new Error('Missing expense.')
      }

      return apiRequest<Expense>(`/expenses/${expense.id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: async (archivedExpense) => {
      removeExpenseFromListCache(queryClient, archivedExpense.id)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.expensesDueAll() }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardSummaries(),
        }),
      ])
      onArchived?.(archivedExpense)
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
