import { Banknote, Monitor, Moon, Palette, Sun } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppearance } from '@/app/appearance-context'
import { currencies, themes } from '@/lib/appearance'
import { languages } from '@/i18n/dictionaries'
import { useI18n } from '@/i18n/i18n-context'
import { cn } from '@/lib/cn'

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export function SettingsPage() {
  const { appearance, setCurrency, setTheme } = useAppearance()
  const { language, setLanguage, t } = useI18n()

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-xl border border-white/45 bg-gradient-to-br from-fuchsia-100/85 via-white/72 to-cyan-100/85 p-5 shadow-2xl shadow-[rgb(var(--shadow-color)/0.1)] backdrop-blur-xl dark:border-fuchsia-300/20 dark:from-fuchsia-950/42 dark:via-slate-950/72 dark:to-cyan-950/42 dark:shadow-fuchsia-500/8">
        <Badge className="bg-fuchsia-500/12 text-fuchsia-700 ring-1 ring-fuchsia-400/20 dark:text-fuchsia-200">
            <Palette size={13} className="mr-1" />
            {t('settings.badge')}
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
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
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {languages.map((languageOption) => (
            <button
              key={languageOption}
              type="button"
              className={cn(
                'kinti-choice-card text-left',
                language === languageOption && 'kinti-choice-card-active',
              )}
              onClick={() => setLanguage(languageOption)}
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-400 text-sm font-extrabold uppercase text-slate-950 shadow-[0_4px_0_rgb(8_145_178)]">
                {languageOption}
              </span>
              <span className="mt-4 block font-extrabold">
                {t(`settings.language.${languageOption}`)}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-amber-300 bg-amber-50 dark:border-yellow-300 dark:bg-yellow-950/25">
        <CardHeader>
          <CardTitle>{t('settings.themeTitle')}</CardTitle>
          <CardDescription>{t('settings.themeDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {themes.map((theme) => {
            const Icon = themeIcons[theme]

            return (
              <button
                key={theme}
                type="button"
                className={cn(
                  'kinti-choice-card text-left',
                  appearance.theme === theme && 'kinti-choice-card-active',
                )}
                onClick={() => setTheme(theme)}
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-300 text-slate-950 shadow-[0_4px_0_rgb(217_119_6)]">
                  <Icon size={20} />
                </span>
                <span className="mt-4 block font-extrabold">
                  {t(`settings.theme.${theme}`)}
                </span>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <Card className="border-emerald-300 bg-emerald-50 dark:border-emerald-300 dark:bg-emerald-950/25">
        <CardHeader>
          <CardTitle>{t('settings.currencyTitle')}</CardTitle>
          <CardDescription>{t('settings.currencyDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {currencies.map((currency) => (
            <button
              key={currency}
              type="button"
              className={cn(
                'kinti-choice-card text-left',
                appearance.currency === currency && 'kinti-choice-card-active',
              )}
              onClick={() => setCurrency(currency)}
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#29c776] text-white shadow-[0_4px_0_#16a063]">
                <Banknote size={20} />
              </span>
              <span className="mt-4 block font-extrabold">
                {t(`settings.currency.${currency}`)}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
