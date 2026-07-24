import { Suspense, lazy, type ReactNode } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from '@/app/protected-route'
import { useI18n } from '@/i18n/i18n-context'

const LandingPage = lazy(() =>
  import('@/features/auth/auth-page').then((module) => ({
    default: module.LandingPage,
  })),
)
const AuthPage = lazy(() =>
  import('@/features/auth/auth-page').then((module) => ({
    default: module.AuthPage,
  })),
)
const AuthProvider = lazy(() =>
  import('@/features/auth/auth-provider').then((module) => ({
    default: module.AuthProvider,
  })),
)
const AppShell = lazy(() =>
  import('@/components/layout/app-shell').then((module) => ({
    default: module.AppShell,
  })),
)
const DashboardPage = lazy(() =>
  import('@/routes/dashboard-page').then((module) => ({
    default: module.DashboardPage,
  })),
)
const ExpensesPage = lazy(() =>
  import('@/routes/expenses-page').then((module) => ({
    default: module.ExpensesPage,
  })),
)
const ExpenseDetailsPage = lazy(() =>
  import('@/routes/expense-details-page').then((module) => ({
    default: module.ExpenseDetailsPage,
  })),
)
const CalendarPage = lazy(() =>
  import('@/routes/calendar-page').then((module) => ({
    default: module.CalendarPage,
  })),
)
const SettingsPage = lazy(() =>
  import('@/routes/settings-page').then((module) => ({
    default: module.SettingsPage,
  })),
)

function RouteLoader() {
  const { t } = useI18n()

  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[rgb(var(--accent-soft))] border-t-[rgb(var(--accent))]" />
        <p className="text-sm text-[rgb(var(--muted-foreground))]">
          {t('common.loadingWorkspace')}
        </p>
      </div>
    </div>
  )
}

function lazyElement(element: ReactNode) {
  return <Suspense fallback={<RouteLoader />}>{element}</Suspense>
}

function authElement(element: ReactNode) {
  return lazyElement(<AuthProvider>{element}</AuthProvider>)
}

const router = createBrowserRouter([
  {
    path: '/',
    element: lazyElement(<LandingPage />),
  },
  {
    path: '/auth',
    element: authElement(<AuthPage />),
  },
  {
    element: authElement(<ProtectedRoute />),
    children: [
      {
        element: lazyElement(<AppShell />),
        children: [
          {
            path: '/dashboard',
            element: lazyElement(<DashboardPage />),
          },
          {
            path: '/expenses',
            element: lazyElement(<ExpensesPage />),
          },
          {
            path: '/expenses/:expenseId',
            element: lazyElement(<ExpenseDetailsPage />),
          },
          {
            path: '/calendar',
            element: lazyElement(<CalendarPage />),
          },
          {
            path: '/settings',
            element: lazyElement(<SettingsPage />),
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
