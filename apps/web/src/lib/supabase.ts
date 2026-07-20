import { createClient } from '@supabase/supabase-js'

import { env } from '@/lib/env'

const fallbackSupabaseUrl = 'https://missing-supabase-url.supabase.co'
const fallbackSupabaseAnonKey = 'missing-supabase-anon-key'

export const supabase = createClient(
  env.supabaseUrl || fallbackSupabaseUrl,
  env.supabaseAnonKey || fallbackSupabaseAnonKey,
)
