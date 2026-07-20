import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { AppearanceProvider } from '@/app/appearance-provider'
import { AuthProvider } from '@/features/auth/auth-provider'
import { I18nProvider } from '@/i18n/i18n-provider'
import { queryClient } from '@/lib/query-client'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </AppearanceProvider>
    </QueryClientProvider>
  )
}
