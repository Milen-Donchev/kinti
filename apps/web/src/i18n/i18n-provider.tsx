import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  defaultLanguage,
  dictionaries,
  isLanguage,
  type Language,
  type TranslationKey,
} from '@/i18n/dictionaries'
import { I18nContext, type I18nContextValue } from '@/i18n/i18n-context'

const storageKey = 'kinti:language'

function readStoredLanguage() {
  const storedLanguage = window.localStorage.getItem(storageKey)

  return isLanguage(storedLanguage) ? storedLanguage : defaultLanguage
}

function interpolate(
  value: string,
  params: Record<string, string | number> = {},
) {
  return value.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
    String(params[key] ?? ''),
  )
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') {
      return defaultLanguage
    }

    return readStoredLanguage()
  })

  useEffect(() => {
    window.localStorage.setItem(storageKey, language)
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage)
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const value = dictionaries[language][key] ?? dictionaries.bg[key] ?? key

      return interpolate(value, params)
    },
    [language],
  )

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
