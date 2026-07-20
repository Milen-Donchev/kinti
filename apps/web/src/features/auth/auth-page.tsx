import { zodResolver } from '@hookform/resolvers/zod'
import { ChartNoAxesCombined, KeyRound, Loader2, Mail, Sparkles, WalletCards } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/auth-context'
import { useI18n } from '@/i18n/i18n-context'
import { getMissingEnvKeys } from '@/lib/env'
import { supabase } from '@/lib/supabase'
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

export function AuthPage() {
  const location = useLocation()
  const { session, isLoading } = useAuth()
  const { t } = useI18n()
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [formError, setFormError] = useState<string | null>(null)
  const [formNotice, setFormNotice] = useState<string | null>(null)
  const missingEnvKeys = useMemo(() => getMissingEnvKeys(), [])

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
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.72fr)]">
      <section className="relative flex min-h-[640px] overflow-hidden border-b-2 border-[rgb(var(--border))] bg-gradient-to-br from-cyan-100 via-white to-amber-100 px-6 py-8 sm:px-10 lg:min-h-screen lg:border-b-0 lg:border-r-2 lg:px-12 dark:border-cyan-300/20 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgb(255_212_90/0.42),transparent_24rem),radial-gradient(circle_at_78%_18%,rgb(53_185_255/0.3),transparent_24rem)] dark:bg-[radial-gradient(circle_at_24%_18%,rgb(53_185_255/0.24),transparent_24rem),radial-gradient(circle_at_78%_16%,rgb(183_125_255/0.22),transparent_24rem)]" />
        <div className="relative z-10 flex w-full flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#29c776] text-white shadow-[0_4px_0_#16a063]">
              <WalletCards size={21} />
            </div>
            <div>
              <p className="font-semibold">{t('common.appName')}</p>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">
                {t('common.tagline')}
              </p>
            </div>
          </div>

          <div className="grid flex-1 items-center gap-8 py-6 xl:grid-cols-[0.88fr_1.12fr]">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-xl border-2 border-[#29c776] bg-[#ddfbea] px-3 py-2 text-sm font-extrabold text-[#16a063] shadow-[0_4px_0_#29c776] dark:bg-[#153a2b] dark:text-[#36d887]">
                <Sparkles size={16} />
                {t('auth.badge')}
              </div>
              <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-normal text-[rgb(var(--foreground))] sm:text-5xl xl:text-6xl">
                {t('auth.heroTitle')}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-[rgb(var(--muted-foreground))]">
                {t('auth.heroDescription')}
              </p>
            </div>

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
                    <p className="text-xs text-[rgb(var(--muted-foreground))]">
                      EUR
                    </p>
                    <p className="text-lg font-semibold">1,240.00</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 top-5 hidden rounded-2xl border-2 border-[#b77dff] bg-white/92 px-4 py-3 shadow-[0_5px_0_#8e58d1] backdrop-blur dark:bg-[rgb(var(--surface)/0.9)] md:block">
                <p className="text-xs text-[rgb(var(--muted-foreground))]">
                  82%
                </p>
                <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950">
                  <div className="h-full w-4/5 rounded-full bg-violet-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
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
                className="font-medium text-[rgb(var(--accent))] hover:underline"
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
      </section>
    </main>
  )
}
