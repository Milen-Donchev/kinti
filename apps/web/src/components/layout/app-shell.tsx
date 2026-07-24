import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Suspense, lazy, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand/brand-logo'
import { prefetchRoute } from '@/app/route-prefetch'
import { useAuth } from '@/features/auth/auth-context'
import { useI18n } from '@/i18n/i18n-context'
import type { TranslationKey } from '@/i18n/dictionaries'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/cn'
import { queryKeys } from '@/lib/query-keys'
import type { Expense } from '@/lib/types'
import { usePageMeta } from '@/lib/use-page-meta'

const AddExpenseModal = lazy(() =>
  import('@/features/expenses/add-expense-modal').then((module) => ({
    default: module.AddExpenseModal,
  })),
)

const navigationItems: Array<{
  label: TranslationKey
  to: string
  icon: typeof LayoutDashboard
}> = [
  {
    label: 'nav.dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'nav.expenses',
    to: '/expenses',
    icon: CreditCard,
  },
  {
    label: 'nav.calendar',
    to: '/calendar',
    icon: CalendarDays,
  },
]

const mobileNavigationItems = [
  ...navigationItems,
  {
    label: 'nav.settings',
    to: '/settings',
    icon: Settings,
  },
] satisfies Array<{
  label: TranslationKey
  to: string
  icon: typeof LayoutDashboard
}>

export function AppShell() {
  const { user, signOut } = useAuth()
  const { language, t } = useI18n()
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  usePageMeta({
    title: t('seo.appTitle'),
    description: t('seo.appDescription'),
    robots: 'noindex, nofollow',
  })
  const expensesQuery = useQuery({
    queryKey: queryKeys.expenses(),
    queryFn: () => apiRequest<Expense[]>('/expenses'),
    staleTime: 60_000,
  })
  const today = new Date()
  const todayExpensesCount =
    expensesQuery.data?.filter((expense) => isExpenseDueToday(expense, today))
      .length ?? 0

  function openAddExpenseModal() {
    setIsAddExpenseOpen(true)
  }

  return (
    <div className="min-h-screen lg:pl-[260px]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[260px] border-r-2 border-[rgb(var(--border))] bg-white px-4 py-5 shadow-[6px_0_0_rgb(var(--border))] dark:bg-[rgb(var(--surface))] lg:block">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center gap-3 px-2">
            <BrandLogo
              wordmark={t('common.appName')}
              tagline={t('common.tagline')}
            />
          </div>

          <Button
            className="mt-8 w-full justify-start"
            size="lg"
            onClick={openAddExpenseModal}
          >
            <Plus size={18} />
            {t('common.addExpense')}
          </Button>

          <div className="mt-4 rounded-2xl border-2 border-[#35b9ff] bg-[#e2f6ff] p-3 text-slate-950 shadow-[0_5px_0_#35b9ff] dark:bg-[#15334a] dark:text-cyan-50">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#35b9ff] text-white shadow-[0_3px_0_#1688c7]">
                <CalendarDays size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold">
                  {formatShortDate(today, language)}
                </p>
                <p className="truncate text-xs text-slate-600 dark:text-cyan-200">
                  {t('sidebar.todayExpenses', { count: todayExpensesCount })}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-7 grid gap-3">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex h-11 items-center gap-3 rounded-xl border-2 border-transparent px-3 text-sm font-extrabold text-[rgb(var(--muted-foreground))] transition-colors hover:border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--foreground))]',
                    isActive &&
                      'border-[#29c776] bg-[#ddfbea] text-[#16a063] shadow-[0_4px_0_#29c776] dark:bg-[#153a2b] dark:text-[#36d887]',
                  )
                }
                onMouseEnter={() => prefetchRoute(item.to)}
                onFocus={() => prefetchRoute(item.to)}
              >
                <item.icon size={18} />
                {t(item.label)}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto grid gap-3">
            <NavLink
              to="/settings"
              onMouseEnter={() => prefetchRoute('/settings')}
              onFocus={() => prefetchRoute('/settings')}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-xl border-2 border-transparent px-3 text-sm font-extrabold text-[rgb(var(--muted-foreground))] transition-colors hover:border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--foreground))]',
                  isActive &&
                    'border-[#29c776] bg-[#ddfbea] text-[#16a063] shadow-[0_4px_0_#29c776] dark:bg-[#153a2b] dark:text-[#36d887]',
                )
              }
            >
              <Settings size={18} />
              {t('nav.settings')}
            </NavLink>

            <div className="rounded-2xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-3 shadow-[0_5px_0_rgb(var(--border))]">
            <p className="truncate text-sm font-medium">
              {user?.email ?? t('common.signedIn')}
            </p>
            <button
              className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
              type="button"
              onClick={() => void signOut()}
            >
              <LogOut size={16} />
              {t('common.signOut')}
            </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 shadow-[0_4px_0_rgb(var(--border))] lg:hidden">
          <BrandLogo
            compact
            markClassName="h-9 w-9 drop-shadow-[0_3px_0_#0f7f50]"
            wordmark={t('common.appName')}
          />
          <Button size="sm" onClick={openAddExpenseModal}>
            <Plus size={16} />
            {t('common.add')}
          </Button>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-5 lg:px-7 lg:py-7">
          <Outlet context={{ openAddExpenseModal }} />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[0_-4px_0_rgb(var(--border))] lg:hidden">
          {mobileNavigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'grid h-16 place-items-center gap-1 text-xs font-medium text-[rgb(var(--muted-foreground))]',
                  isActive && 'text-[rgb(var(--accent))]',
                )
              }
            >
              <item.icon size={19} />
              {t(item.label)}
            </NavLink>
          ))}
        </nav>

        <Button
          className="fixed bottom-20 right-4 z-30 rounded-lg shadow-lg shadow-[rgb(var(--shadow-color)/0.18)] lg:hidden"
          size="icon"
          aria-label={t('common.addExpense')}
          onClick={openAddExpenseModal}
        >
          <Plus size={20} />
        </Button>

        <div className="h-20 lg:hidden" />
      </div>
      {isAddExpenseOpen ? (
        <Suspense fallback={null}>
          <AddExpenseModal
            isOpen={isAddExpenseOpen}
            onClose={() => setIsAddExpenseOpen(false)}
          />
        </Suspense>
      ) : null}
    </div>
  )
}

function formatShortDate(date: Date, language: string) {
  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function isExpenseDueToday(expense: Expense, today: Date) {
  const dueDate = parseDateValue(expense.dueDate)

  if (expense.billingPeriod === 'monthly') {
    return dueDate.getDate() === today.getDate()
  }

  if (expense.billingPeriod === 'yearly') {
    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth()
    )
  }

  return dueDate.toDateString() === today.toDateString()
}

function parseDateValue(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)

  return new Date(year, month - 1, day)
}
