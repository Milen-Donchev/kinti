import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChartNoAxesCombined,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Loader2,
  Mail,
  Monitor,
  Moon,
  Settings2,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand/brand-logo'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAppearance } from '@/app/appearance-context'
import { useAuth } from '@/features/auth/auth-context'
import { languages, type Language } from '@/i18n/dictionaries'
import { useI18n } from '@/i18n/i18n-context'
import { themes } from '@/lib/appearance'
import { cn } from '@/lib/cn'
import { getMissingEnvKeys } from '@/lib/env'
import { supabase } from '@/lib/supabase'
import { usePageMeta } from '@/lib/use-page-meta'
import lightHeroImage from '@/assets/calm-finance-hero.jpg'
import darkHeroImage from '@/assets/tokyo-finance-jumbotron.jpg'

function createAuthSchema(t: ReturnType<typeof useI18n>['t']) {
  return z.object({
    email: z.string().email(t('auth.emailInvalid')),
    password: z.string().min(6, t('auth.passwordMin')),
  })
}

type AuthFormValues = z.infer<ReturnType<typeof createAuthSchema>>

type AuthMode = 'sign-in' | 'sign-up'

const languageFlags: Record<Language, string> = {
  bg: '🇧🇬',
  en: '🇬🇧',
  es: '🇪🇸',
}

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const authBenefits = [
  {
    title: 'auth.benefit.trackTitle',
    description: 'auth.benefit.trackDescription',
    icon: CreditCard,
  },
  {
    title: 'auth.benefit.planTitle',
    description: 'auth.benefit.planDescription',
    icon: ChartNoAxesCombined,
  },
  {
    title: 'auth.benefit.calmTitle',
    description: 'auth.benefit.calmDescription',
    icon: CheckCircle2,
  },
] as const

export function LandingPage() {
  const { language, setLanguage, t } = useI18n()
  const { appearance, setTheme } = useAppearance()
  usePageMeta({
    title: t('seo.homeTitle'),
    description: t('seo.homeDescription'),
    canonicalUrl: 'https://levko.bg/',
    robots: 'index, follow',
  })

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-100 via-white to-amber-100 px-6 py-8 sm:px-10 lg:px-12 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgb(255_212_90/0.42),transparent_24rem),radial-gradient(circle_at_78%_18%,rgb(53_185_255/0.3),transparent_24rem)] dark:bg-[radial-gradient(circle_at_24%_18%,rgb(53_185_255/0.24),transparent_24rem),radial-gradient(circle_at_78%_16%,rgb(183_125_255/0.22),transparent_24rem)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <BrandLogo
            wordmark={t('common.appName')}
            tagline={t('common.tagline')}
          />

          <AuthPreferencesPopover
            language={language}
            theme={appearance.theme}
            onLanguageChange={setLanguage}
            onThemeChange={setTheme}
          />
        </header>

        <section className="grid flex-1 items-center gap-8 py-4 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-xl border-2 border-[#29c776] bg-[#ddfbea] px-3 py-2 text-sm font-extrabold text-[#16a063] shadow-[0_4px_0_#29c776] dark:bg-[#153a2b] dark:text-[#36d887]">
              <Sparkles size={16} />
              {t('auth.badge')}
            </div>
            <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-normal text-[rgb(var(--foreground))] sm:text-5xl xl:text-[3.65rem]">
              {t('auth.heroTitle')}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-[rgb(var(--muted-foreground))]">
              {t('auth.heroDescription')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">{t('auth.openAuth')}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth">{t('auth.signInAction')}</Link>
              </Button>
            </div>
          </div>

          <HeroPreview />
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {authBenefits.map((benefit) => (
            <div
              key={benefit.title}
              className="flex min-h-[92px] items-start gap-3 rounded-2xl border-2 border-[#b8d5ee] bg-white/82 p-3 shadow-[0_4px_0_#b8d5ee] backdrop-blur dark:border-cyan-300/20 dark:bg-white/8 dark:shadow-none"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#29c776] text-white shadow-[0_3px_0_#16a063]">
                <benefit.icon size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold leading-5 text-[rgb(var(--foreground))]">
                  {t(benefit.title)}
                </p>
                <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted-foreground))]">
                  {t(benefit.description)}
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

export function AuthPage() {
  const location = useLocation()
  const { session, isLoading } = useAuth()
  const { language, setLanguage, t } = useI18n()
  const { appearance, setTheme } = useAppearance()
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [formError, setFormError] = useState<string | null>(null)
  const [formNotice, setFormNotice] = useState<string | null>(null)
  const missingEnvKeys = useMemo(() => getMissingEnvKeys(), [])
  usePageMeta({
    title: t('seo.authTitle'),
    description: t('seo.authDescription'),
    robots: 'noindex, nofollow',
  })

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(createAuthSchema(t)),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const redirectPath =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state
      ? '/dashboard'
      : '/dashboard'

  if (!isLoading && session) {
    return <Navigate to={redirectPath} replace />
  }

  async function handleSubmit(values: AuthFormValues) {
    setFormError(null)
    setFormNotice(null)

    const result =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword(values)
        : await supabase.auth.signUp({
            email: values.email,
            password: values.password,
          })

    if (result.error) {
      setFormError(result.error.message)
      return
    }

    if (mode === 'sign-up') {
      setFormNotice(t('auth.signUpNotice'))
    }
  }

  async function handleGoogleSignIn() {
    setFormError(null)
    setFormNotice(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setFormError(error.message)
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-cyan-100 via-white to-amber-100 px-6 py-8 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgb(255_212_90/0.42),transparent_24rem),radial-gradient(circle_at_78%_18%,rgb(53_185_255/0.3),transparent_24rem)] dark:bg-[radial-gradient(circle_at_24%_18%,rgb(53_185_255/0.24),transparent_24rem),radial-gradient(circle_at_78%_16%,rgb(183_125_255/0.22),transparent_24rem)]" />
      <div className="relative z-10 grid w-full max-w-md gap-6">
        <div className="flex items-start justify-between gap-4">
          <Link to="/" aria-label={t('seo.homeTitle')}>
            <BrandLogo
              wordmark={t('common.appName')}
              tagline={t('common.tagline')}
            />
          </Link>

          <AuthPreferencesPopover
            language={language}
            theme={appearance.theme}
            onLanguageChange={setLanguage}
            onThemeChange={setTheme}
          />
        </div>

        <Card className="w-full max-w-md border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.88)] shadow-2xl shadow-[rgb(var(--shadow-color)/0.12)] backdrop-blur">
          <CardHeader>
            <CardTitle>
              {mode === 'sign-in'
                ? t('auth.signInTitle')
                : t('auth.signUpTitle')}
            </CardTitle>
            <CardDescription>
              {mode === 'sign-in'
                ? t('auth.signInDescription')
                : t('auth.signUpDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {missingEnvKeys.length > 0 ? (
              <div className="mb-4 rounded-md border border-[rgb(var(--warning)/0.35)] bg-[rgb(var(--warning)/0.08)] p-3 text-sm text-[rgb(var(--warning))]">
                {t('auth.missingEnv', { keys: missingEnvKeys.join(', ') })}
              </div>
            ) : null}

            <form
              className="grid gap-4"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <Field
                label={t('common.email')}
                htmlFor="auth-email"
                error={form.formState.errors.email?.message}
              >
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]"
                    size={17}
                  />
                  <Input
                    id="auth-email"
                    className="pl-10"
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    {...form.register('email')}
                  />
                </div>
              </Field>

              <Field
                label={t('common.password')}
                htmlFor="auth-password"
                error={form.formState.errors.password?.message}
              >
                <div className="relative">
                  <KeyRound
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]"
                    size={17}
                  />
                  <Input
                    id="auth-password"
                    className="pl-10"
                    placeholder="••••••••"
                    type="password"
                    autoComplete={
                      mode === 'sign-in' ? 'current-password' : 'new-password'
                    }
                    {...form.register('password')}
                  />
                </div>
              </Field>

              {formError ? (
                <p className="rounded-md bg-[rgb(var(--danger)/0.08)] p-3 text-sm text-[rgb(var(--danger))]">
                  {formError}
                </p>
              ) : null}

              {formNotice ? (
                <p className="rounded-md bg-[rgb(var(--success)/0.08)] p-3 text-sm text-[rgb(var(--success))]">
                  {formNotice}
                </p>
              ) : null}

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin" size={17} /> : null}
                {mode === 'sign-in'
                  ? t('auth.signInAction')
                  : t('auth.signUpAction')}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-[rgb(var(--muted))]">
              <div className="h-px flex-1 bg-[rgb(var(--border))]" />
              {t('common.or')}
              <div className="h-px flex-1 bg-[rgb(var(--border))]" />
            </div>

            <Button className="w-full" variant="secondary" onClick={handleGoogleSignIn}>
              <Mail size={17} />
              {t('auth.continueWithGoogle')}
            </Button>

            <p className="mt-5 text-center text-sm text-[rgb(var(--muted-foreground))]">
              {mode === 'sign-in' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
              <button
                className="cursor-pointer font-medium text-[rgb(var(--accent))] hover:underline"
                type="button"
                onClick={() =>
                  setMode((current) =>
                    current === 'sign-in' ? 'sign-up' : 'sign-in',
                  )
                }
              >
                {mode === 'sign-in'
                  ? t('auth.switchToSignUp')
                  : t('auth.switchToSignIn')}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function HeroPreview() {
  return (
    <div className="relative self-center">
      <div className="overflow-hidden rounded-3xl border-2 border-[#35b9ff] bg-white/70 p-2 shadow-[0_8px_0_#35b9ff] backdrop-blur dark:border-cyan-300/35 dark:bg-white/5 dark:shadow-[0_8px_0_#164e75]">
        <img
          className="aspect-[16/11] w-full rounded-2xl object-cover dark:hidden"
          src={lightHeroImage}
          alt=""
        />
        <img
          className="hidden aspect-[16/11] w-full rounded-2xl object-cover dark:block"
          src={darkHeroImage}
          alt=""
        />
        <div className="pointer-events-none absolute inset-2 rounded-2xl bg-gradient-to-r from-white/10 via-transparent to-transparent dark:from-slate-950/45" />
      </div>
      <div className="absolute -bottom-5 left-5 hidden rounded-2xl border-2 border-[#29c776] bg-white/92 p-4 shadow-[0_5px_0_#29c776] backdrop-blur dark:bg-[rgb(var(--surface)/0.92)] sm:block">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#29c776] text-white shadow-[0_3px_0_#16a063]">
            <ChartNoAxesCombined size={19} />
          </div>
          <div>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">EUR</p>
            <p className="text-lg font-semibold">1,240.00</p>
          </div>
        </div>
      </div>
      <div className="absolute -right-4 top-5 hidden rounded-2xl border-2 border-[#b77dff] bg-white/92 px-4 py-3 shadow-[0_5px_0_#8e58d1] backdrop-blur dark:bg-[rgb(var(--surface)/0.9)] md:block">
        <p className="text-xs text-[rgb(var(--muted-foreground))]">82%</p>
        <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950">
          <div className="h-full w-4/5 rounded-full bg-violet-500" />
        </div>
      </div>
    </div>
  )
}

function AuthPreferencesPopover({
  language,
  theme,
  onLanguageChange,
  onThemeChange,
}: {
  language: Language
  theme: (typeof themes)[number]
  onLanguageChange: (language: Language) => void
  onThemeChange: (theme: (typeof themes)[number]) => void
}) {
  const { t } = useI18n()
  const ThemeIcon = themeIcons[theme]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-10 shrink-0 rounded-2xl bg-white/82 px-3 shadow-[0_4px_0_rgb(var(--border))] backdrop-blur dark:bg-slate-950/60"
          type="button"
          variant="secondary"
          aria-label={t('auth.preferences')}
        >
          <span className="text-base leading-none">{languageFlags[language]}</span>
          <ThemeIcon size={15} />
          <Settings2 size={15} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="grid gap-4">
          <AuthSegmentedControl
            label={t('settings.languageTitle')}
            options={languages.map((languageOption) => ({
              value: languageOption,
              label: languageFlags[languageOption],
              title: t(`settings.language.${languageOption}`),
            }))}
            value={language}
            onChange={onLanguageChange}
          />
          <AuthSegmentedControl
            label={t('settings.themeTitle')}
            options={themes.map((themeOption) => {
              const Icon = themeIcons[themeOption]

              return {
                value: themeOption,
                label: <Icon size={15} />,
                title: t(`settings.theme.${themeOption}`),
              }
            })}
            value={theme}
            onChange={onThemeChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function AuthSegmentedControl<TValue extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{
    value: TValue
    label: ReactNode
    title: string
  }>
  value: TValue
  onChange: (value: TValue) => void
}) {
  return (
    <div className="grid gap-2">
      <p className="px-1 text-xs font-extrabold uppercase text-[rgb(var(--muted-foreground))]">
        {label}
      </p>
      <div
        className="flex items-center gap-1 rounded-2xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-1"
        aria-label={label}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            title={option.title}
            aria-label={option.title}
            className={cn(
              'grid h-9 flex-1 cursor-pointer place-items-center rounded-xl px-2 text-sm font-extrabold text-[rgb(var(--muted-foreground))] transition-colors hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--foreground))]',
              value === option.value &&
                'bg-[#29c776] text-white shadow-[0_3px_0_#16a063]',
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
