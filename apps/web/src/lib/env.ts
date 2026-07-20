type AppEnv = {
  apiUrl: string
  supabaseUrl: string
  supabaseAnonKey: string
}

function readEnvValue(key: keyof ImportMetaEnv) {
  const value = import.meta.env[key]

  return typeof value === 'string' ? value.trim() : ''
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
