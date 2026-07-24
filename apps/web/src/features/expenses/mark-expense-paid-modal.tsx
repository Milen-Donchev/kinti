import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useI18n } from '@/i18n/i18n-context'
import { apiRequest } from '@/lib/api'
import {
  formatDateValue,
  getExpenseDueDateInPeriod,
  parseDateValue,
} from '@/lib/expense-schedule'
import { markExpensePaidInCache } from '@/lib/query-cache-updates'
import { queryKeys } from '@/lib/query-keys'
import type { ExpenseSummary } from '@/lib/types'

const amountRegex = /^\d{1,8}(\.\d{1,2})?$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

type PaymentFormValues = {
  amountSnapshot: string
  paidAt: string
}

type MarkExpensePaidModalProps = {
  expense: ExpenseSummary | null
  period: { month: number; year: number }
  onClose: () => void
  onSuccess?: () => Promise<void> | void
}

function createPaymentSchema(t: ReturnType<typeof useI18n>['t']) {
  return z.object({
    amountSnapshot: z
      .string()
      .trim()
      .regex(amountRegex, t('paymentForm.amountInvalid')),
    paidAt: z.string().regex(dateRegex, t('paymentForm.paidAtRequired')),
  })
}

export function MarkExpensePaidModal({
  expense,
  period,
  onClose,
  onSuccess,
}: MarkExpensePaidModalProps) {
  const queryClient = useQueryClient()
  const { language, t } = useI18n()
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(createPaymentSchema(t)),
    values: {
      amountSnapshot: expense?.defaultAmount ?? '',
      paidAt: expense ? getDefaultPaymentDate(expense, period) : '',
    },
  })

  const markPaidMutation = useMutation({
    mutationFn: (values: PaymentFormValues) => {
      if (!expense) {
        throw new Error('Missing expense.')
      }

      return apiRequest(`/payments/expenses/${expense.id}`, {
        method: 'POST',
        body: {
          periodMonth: period.month,
          periodYear: period.year,
          amountSnapshot: values.amountSnapshot,
          paidAt: values.paidAt,
        },
      })
    },
    onMutate: async (values) => {
      if (!expense) {
        return
      }

      await Promise.all([
        queryClient.cancelQueries({
          queryKey: queryKeys.expense(expense.id),
        }),
        queryClient.cancelQueries({
          queryKey: queryKeys.dashboardSummary(period),
        }),
        queryClient.cancelQueries({
          queryKey: queryKeys.payments(period),
        }),
      ])

      markExpensePaidInCache(queryClient, {
        expense,
        period,
        amountSnapshot: values.amountSnapshot,
        paidAt: values.paidAt,
      })
    },
    onError: async () => {
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardSummary(period),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.payments(period),
        }),
      ]

      if (expense) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.expense(expense.id),
          }),
        )
      }

      await Promise.all(invalidations)
    },
    onSuccess: async () => {
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardSummary(period),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.payments(period),
        }),
      ]

      if (expense) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.expense(expense.id),
          }),
        )
      }

      await Promise.all(invalidations)
      await onSuccess?.()
      onClose()
    },
  })

  function handleClose() {
    if (markPaidMutation.isPending) {
      return
    }

    form.clearErrors()
    onClose()
  }

  return (
    <Modal
      title={t('paymentForm.title')}
      description={t('paymentForm.description')}
      isOpen={Boolean(expense)}
      onClose={handleClose}
      closeLabel={t('common.close')}
      className="sm:max-w-xl"
    >
      <form
        className="grid gap-5"
        onSubmit={form.handleSubmit((values) =>
          markPaidMutation.mutate(values),
        )}
      >
        {markPaidMutation.isError ? (
          <p className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-[rgb(var(--danger))] shadow-[0_4px_0_rgb(253_164_175)] dark:border-rose-500/50 dark:bg-rose-950/30">
            {t('paymentForm.createError')}
          </p>
        ) : null}

        <section className="grid gap-4 rounded-3xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-4 shadow-[0_5px_0_rgb(var(--border))]">
          <Field
            label={t('paymentForm.amount')}
            htmlFor="payment-amount"
            error={form.formState.errors.amountSnapshot?.message}
          >
            <Input
              id="payment-amount"
              inputMode="decimal"
              placeholder={t('paymentForm.amountPlaceholder')}
              {...form.register('amountSnapshot')}
            />
          </Field>

          <Controller
            control={form.control}
            name="paidAt"
            render={({ field }) => (
              <Field
                label={t('paymentForm.paidAt')}
                htmlFor="payment-paid-at"
                error={form.formState.errors.paidAt?.message}
              >
                <DatePicker
                  id="payment-paid-at"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('paymentForm.paidAtPlaceholder')}
                  language={language}
                />
              </Field>
            )}
          />
        </section>

        <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 flex items-center justify-end gap-3 border-t-2 border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.94)] px-5 py-4 backdrop-blur">
          <Button
            type="button"
            variant="secondary"
            disabled={markPaidMutation.isPending}
            onClick={handleClose}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={markPaidMutation.isPending}>
            {markPaidMutation.isPending ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Check size={17} />
            )}
            {t('paymentForm.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function getDefaultPaymentDate(
  expense: ExpenseSummary,
  period: { month: number; year: number },
) {
  return formatDateValue(
    getExpenseDueDateInPeriod(expense, period) ?? parseDateValue(expense.dueDate),
  )
}
