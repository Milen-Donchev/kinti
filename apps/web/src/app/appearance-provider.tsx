import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  AppearanceContext,
  type AppearanceContextValue,
} from '@/app/appearance-context'
import {
  applyAppearance,
  defaultAppearance,
  readStoredAppearance,
  storeAppearance,
  type Appearance,
} from '@/lib/appearance'

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>(() => {
    if (typeof window === 'undefined') {
      return defaultAppearance
    }

    return readStoredAppearance()
  })

  useEffect(() => {
    applyAppearance(appearance)
    storeAppearance(appearance)
  }, [appearance])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const syncSystemTheme = () => {
      setAppearance((current) => ({ ...current }))
    }

    media.addEventListener('change', syncSystemTheme)

    return () => {
      media.removeEventListener('change', syncSystemTheme)
    }
  }, [])

  const value = useMemo<AppearanceContextValue>(
    () => ({
      appearance,
      setTheme: (theme) => setAppearance((current) => ({ ...current, theme })),
      setCurrency: (currency) =>
        setAppearance((current) => ({ ...current, currency })),
    }),
    [appearance],
  )

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  )
}
