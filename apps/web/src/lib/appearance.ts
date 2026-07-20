export const themes = ['light', 'dark', 'system'] as const
export const currencies = ['eur', 'usd', 'gbp'] as const

export type Theme = (typeof themes)[number]
export type Currency = (typeof currencies)[number]

export type Appearance = {
  theme: Theme
  currency: Currency
}

export const defaultAppearance: Appearance = {
  theme: 'system',
  currency: 'eur',
}

const storageKey = 'kinti:appearance'

function getResolvedTheme(theme: Theme) {
  if (theme !== 'system') {
    return theme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function readStoredAppearance(): Appearance {
  const rawValue = window.localStorage.getItem(storageKey)

  if (!rawValue) {
    return defaultAppearance
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<Appearance>
    const theme = parsed.theme ?? defaultAppearance.theme
    const currency = parsed.currency ?? defaultAppearance.currency

    return {
      theme: themes.includes(theme)
        ? theme
        : defaultAppearance.theme,
      currency: currencies.includes(currency)
        ? currency
        : defaultAppearance.currency,
    }
  } catch {
    return defaultAppearance
  }
}

export function storeAppearance(appearance: Appearance) {
  window.localStorage.setItem(storageKey, JSON.stringify(appearance))
}

export function applyAppearance(appearance: Appearance) {
  const root = document.documentElement

  root.dataset.theme = getResolvedTheme(appearance.theme)
}
