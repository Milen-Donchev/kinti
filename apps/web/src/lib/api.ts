import { supabase } from '@/lib/supabase'
import { env } from '@/lib/env'

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

type ApiErrorBody = {
  message?: string | string[]
  error?: string
  statusCode?: number
  code?: string
}

async function readErrorMessage(response: Response) {
  const fallbackMessage = `Request failed with status ${response.status}`
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    return (await response.text()) || fallbackMessage
  }

  try {
    const body = (await response.json()) as ApiErrorBody
    const message = Array.isArray(body.message)
      ? body.message.join('\n')
      : body.message

    return message || body.error || fallbackMessage
  } catch {
    return fallbackMessage
  }
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
    throw new Error(await readErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}
