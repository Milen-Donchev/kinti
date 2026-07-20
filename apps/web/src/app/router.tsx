import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from '@/app/protected-route'
import { AppShell } from '@/components/layout/app-shell'
import { AuthPage } from '@/features/auth/auth-page'
import { DashboardPage } from '@/routes/dashboard-page'
import { ExpensesPage } from '@/routes/expenses-page'
import { SettingsPage } from '@/routes/settings-page'

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/expenses',
            element: <ExpensesPage />,
          },
          {
            path: '/settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
