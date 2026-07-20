import bg from '@/i18n/locales/bg.json'
import en from '@/i18n/locales/en.json'
import es from '@/i18n/locales/es.json'

export const languages = ['bg', 'en', 'es'] as const

export type Language = (typeof languages)[number]
export type TranslationKey = keyof typeof bg

export const defaultLanguage: Language = 'bg'

export const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  bg,
  en,
  es,
}

export function isLanguage(value: string | null): value is Language {
  return languages.includes(value as Language)
}
