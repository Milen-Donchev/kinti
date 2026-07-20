import { createContext, useContext } from 'react'

import type { Appearance, Currency, Theme } from '@/lib/appearance'

export type AppearanceContextValue = {
  appearance: Appearance
  setTheme: (theme: Theme) => void
  setCurrency: (currency: Currency) => void
}

export const AppearanceContext =
  createContext<AppearanceContextValue | null>(null)

export function useAppearance() {
  const value = useContext(AppearanceContext)

  if (!value) {
    throw new Error('useAppearance must be used within AppearanceProvider.')
  }

  return value
}
