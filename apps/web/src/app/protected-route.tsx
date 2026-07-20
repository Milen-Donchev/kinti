import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/auth-context'
import { useI18n } from '@/i18n/i18n-context'

export function ProtectedRoute() {
  const location = useLocation()
  const { session, isLoading } = useAuth()
  const { t } = useI18n()

  if (isLoading) {
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

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return <Outlet />
}
