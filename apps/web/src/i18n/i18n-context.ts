import { createContext, useContext } from 'react'

import type { Language, TranslationKey } from '@/i18n/dictionaries'

type TranslationParams = Record<string, string | number>

export type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, params?: TranslationParams) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

export function useI18n() {
  const value = useContext(I18nContext)

  if (!value) {
    throw new Error('useI18n must be used within I18nProvider.')
  }

  return value
}
