type AppEnv = {
  apiUrl: string
  supabaseUrl: string
  supabaseAnonKey: string
}

type RuntimeEnvKey =
  | 'VITE_API_URL'
  | 'VITE_SUPABASE_URL'
  | 'VITE_SUPABASE_ANON_KEY'

declare global {
  interface Window {
    __KINTI_CONFIG__?: Partial<Record<RuntimeEnvKey, string>>
  }
}

function readRuntimeEnvValue(key: RuntimeEnvKey) {
  if (typeof window === 'undefined') {
    return ''
  }

  const value = window.__KINTI_CONFIG__?.[key]

  return typeof value === 'string' ? value.trim() : ''
}

function readBuildEnvValue(key: keyof ImportMetaEnv) {
  const value = import.meta.env[key]

  return typeof value === 'string' ? value.trim() : ''
}

function readEnvValue(key: RuntimeEnvKey) {
  return readRuntimeEnvValue(key) || readBuildEnvValue(key)
}

export const env: AppEnv = {
  apiUrl: readEnvValue('VITE_API_URL').replace(/\/$/, ''),
  supabaseUrl: readEnvValue('VITE_SUPABASE_URL'),
  supabaseAnonKey: readEnvValue('VITE_SUPABASE_ANON_KEY'),
}

export function getMissingEnvKeys() {
  const missingKeys: string[] = []

  if (!env.apiUrl) {
    missingKeys.push('VITE_API_URL')
  }

  if (!env.supabaseUrl) {
    missingKeys.push('VITE_SUPABASE_URL')
  }

  if (!env.supabaseAnonKey) {
    missingKeys.push('VITE_SUPABASE_ANON_KEY')
  }

  return missingKeys
}
