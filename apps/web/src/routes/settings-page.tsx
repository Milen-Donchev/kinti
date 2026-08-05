import {
  AlertTriangle,
  Check,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Sun,
  Trash2,
} from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useAppearance } from '@/app/appearance-context'
import { useAuth } from '@/features/auth/auth-context'
import { currencies, themes, type Currency } from '@/lib/appearance'
import { apiRequest } from '@/lib/api'
import { languages, type Language } from '@/i18n/dictionaries'
import { useI18n } from '@/i18n/i18n-context'
import { cn } from '@/lib/cn'
import { useTranslatedError } from '@/lib/use-translated-error'

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const languageFlags: Record<Language, string> = {
  bg: '🇧🇬',
  en: '🇬🇧',
  es: '🇪🇸',
}

const currencySymbols: Record<Currency, string> = {
  eur: '€',
  usd: '$',
  gbp: '£',
}

const settingChoiceTones = {
  language: {
    active:
      'border-cyan-300 bg-cyan-100 shadow-[0_4px_0_rgb(103_232_249)] dark:border-cyan-300 dark:bg-cyan-950/50 dark:shadow-[0_4px_0_rgb(14_116_144)]',
    icon: 'bg-cyan-300 text-cyan-950 shadow-[0_3px_0_rgb(8_145_178)] dark:bg-cyan-300 dark:text-cyan-950 dark:shadow-[0_3px_0_rgb(14_116_144)]',
    check:
      'bg-cyan-400 text-cyan-950 shadow-[0_2px_0_rgb(8_145_178)] dark:bg-cyan-300 dark:text-cyan-950 dark:shadow-[0_2px_0_rgb(14_116_144)]',
  },
  theme: {
    active:
      'border-amber-300 bg-amber-100 shadow-[0_4px_0_rgb(252_211_77)] dark:border-yellow-300 dark:bg-yellow-950/45 dark:shadow-[0_4px_0_rgb(180_83_9)]',
    icon: 'bg-amber-300 text-amber-950 shadow-[0_3px_0_rgb(217_119_6)] dark:bg-yellow-300 dark:text-yellow-950 dark:shadow-[0_3px_0_rgb(180_83_9)]',
    check:
      'bg-amber-300 text-amber-950 shadow-[0_2px_0_rgb(217_119_6)] dark:bg-yellow-300 dark:text-yellow-950 dark:shadow-[0_2px_0_rgb(180_83_9)]',
  },
  currency: {
    active:
      'border-emerald-300 bg-emerald-100 shadow-[0_4px_0_rgb(110_231_183)] dark:border-emerald-300 dark:bg-emerald-950/45 dark:shadow-[0_4px_0_rgb(5_150_105)]',
    icon: 'bg-emerald-400 text-emerald-950 shadow-[0_3px_0_rgb(5_150_105)] dark:bg-emerald-300 dark:text-emerald-950 dark:shadow-[0_3px_0_rgb(5_150_105)]',
    check:
      'bg-emerald-400 text-emerald-950 shadow-[0_2px_0_rgb(5_150_105)] dark:bg-emerald-300 dark:text-emerald-950 dark:shadow-[0_2px_0_rgb(5_150_105)]',
  },
}

type SettingChoiceTone = keyof typeof settingChoiceTones

export function SettingsPage() {
  const { appearance, setCurrency, setTheme } = useAppearance()
  const { language, setLanguage, t } = useI18n()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const translateError = useTranslatedError()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const deleteAccountMutation = useMutation({
    mutationFn: () =>
      apiRequest<void>('/auth/me', {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      try {
        await signOut()
      } finally {
        navigate('/auth', { replace: true })
      }
    },
  })
  const canDeleteAccount =
    deleteConfirmation.trim().toUpperCase() === 'DELETE' &&
    !deleteAccountMutation.isPending

  function closeDeleteModal() {
    if (deleteAccountMutation.isPending) {
      return
    }

    setIsDeleteModalOpen(false)
    setDeleteConfirmation('')
    deleteAccountMutation.reset()
  }

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-xl border border-white/45 bg-gradient-to-br from-fuchsia-100/85 via-white/72 to-cyan-100/85 p-5 shadow-2xl shadow-[rgb(var(--shadow-color)/0.1)] backdrop-blur-xl dark:border-fuchsia-300/20 dark:from-fuchsia-950/42 dark:via-slate-950/72 dark:to-cyan-950/42 dark:shadow-fuchsia-500/8">
        <Badge className="bg-fuchsia-500/12 text-fuchsia-700 ring-1 ring-fuchsia-400/20 dark:text-fuchsia-200">
          <Palette size={13} className="mr-1" />
          {t('settings.badge')}
        </Badge>
        <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
          {t('settings.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--muted-foreground))]">
          {t('settings.description')}
        </p>
      </section>

      <Card className="border-cyan-300 bg-cyan-50 dark:border-cyan-300 dark:bg-cyan-950/30">
        <CardHeader>
          <CardTitle>{t('settings.languageTitle')}</CardTitle>
          <CardDescription>{t('settings.languageDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {languages.map((languageOption) => (
            <CompactChoice
              key={languageOption}
              icon={
                <span className="text-xl leading-none">
                  {languageFlags[languageOption]}
                </span>
              }
              label={t(`settings.language.${languageOption}`)}
              isActive={language === languageOption}
              tone="language"
              onClick={() => setLanguage(languageOption)}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="border-amber-300 bg-amber-50 dark:border-yellow-300 dark:bg-yellow-950/25">
        <CardHeader>
          <CardTitle>{t('settings.themeTitle')}</CardTitle>
          <CardDescription>{t('settings.themeDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {themes.map((theme) => {
            const Icon = themeIcons[theme]

            return (
              <CompactChoice
                key={theme}
                icon={<Icon size={18} />}
                label={t(`settings.theme.${theme}`)}
                isActive={appearance.theme === theme}
                tone="theme"
                onClick={() => setTheme(theme)}
              />
            )
          })}
        </CardContent>
      </Card>

      <Card className="border-emerald-300 bg-emerald-50 dark:border-emerald-300 dark:bg-emerald-950/25">
        <CardHeader>
          <CardTitle>{t('settings.currencyTitle')}</CardTitle>
          <CardDescription>{t('settings.currencyDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {currencies.map((currency) => (
            <CompactChoice
              key={currency}
              icon={
                <span className="text-base font-black">
                  {currencySymbols[currency]}
                </span>
              }
              label={t(`settings.currency.${currency}`)}
              isActive={appearance.currency === currency}
              tone="currency"
              onClick={() => setCurrency(currency)}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="border-rose-300 bg-rose-50 dark:border-rose-400/80 dark:bg-rose-950/25">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-400 text-white shadow-[0_3px_0_rgb(190_18_60)]">
              <AlertTriangle size={18} />
            </div>
            <div>
              <CardTitle>{t('settings.accountDangerTitle')}</CardTitle>
              <CardDescription>
                {t('settings.accountDangerDescription')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 size={16} />
            {t('settings.deleteAccount')}
          </Button>
        </CardContent>
      </Card>

      <Modal
        title={t('settings.deleteAccountModalTitle')}
        description={t('settings.deleteAccountModalDescription')}
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        closeLabel={t('common.close')}
        className="sm:max-w-lg"
      >
        <div className="grid gap-4">
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-sm leading-6 text-rose-950 shadow-[0_4px_0_rgb(253_164_175)] dark:border-rose-400/60 dark:bg-rose-950/30 dark:text-rose-100">
            {t('settings.deleteAccountWarning')}
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-[rgb(var(--foreground))]">
              {t('settings.deleteAccountConfirmLabel')}
            </span>
            <Input
              value={deleteConfirmation}
              placeholder="DELETE"
              autoComplete="off"
              onChange={(event) => setDeleteConfirmation(event.target.value)}
            />
          </label>

          {deleteAccountMutation.error ? (
            <p className="rounded-xl bg-[rgb(var(--danger)/0.08)] p-3 text-sm font-semibold text-[rgb(var(--danger))]">
              {translateError(
                deleteAccountMutation.error,
                'settings.deleteAccountError',
              )}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={closeDeleteModal}
              disabled={deleteAccountMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!canDeleteAccount}
              onClick={() => deleteAccountMutation.mutate()}
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Trash2 size={16} />
              )}
              {t('settings.deleteAccountConfirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function CompactChoice({
  icon,
  label,
  isActive,
  tone,
  onClick,
}: {
  icon: ReactNode
  label: string
  isActive: boolean
  tone: SettingChoiceTone
  onClick: () => void
}) {
  const selectedTone = settingChoiceTones[tone]

  return (
    <button
      type="button"
      className={cn(
        'flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2.5 text-left shadow-[0_4px_0_rgb(var(--border))] transition-colors hover:bg-[rgb(var(--surface-subtle))]',
        isActive && selectedTone.active,
      )}
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgb(var(--surface-subtle))] text-[rgb(var(--foreground))]',
            isActive && selectedTone.icon,
          )}
        >
          {icon}
        </span>
        <span className="truncate text-sm font-extrabold">{label}</span>
      </span>
      {isActive ? (
        <span
          className={cn(
            'grid h-6 w-6 shrink-0 place-items-center rounded-full',
            selectedTone.check,
          )}
        >
          <Check size={13} />
        </span>
      ) : null}
    </button>
  )
}
