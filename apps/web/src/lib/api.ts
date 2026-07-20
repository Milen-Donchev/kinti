import { supabase } from '@/lib/supabase'
import { env } from '@/lib/env'

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiOptions = {},
) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Missing active session.')
  }

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}
