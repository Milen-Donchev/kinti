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

export class ApiError extends Error {
  constructor({
    code,
    message,
    requestId,
    statusCode,
  }: {
    code: string
    message: string
    requestId?: string
    statusCode?: number
  }) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.requestId = requestId
    this.statusCode = statusCode
  }

  code: string
  requestId?: string
  statusCode?: number
}

async function readError(response: Response) {
  const fallbackMessage = `Request failed with status ${response.status}`
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    return {
      code: `HTTP_${response.status}`,
      message: (await response.text()) || fallbackMessage,
      statusCode: response.status,
    }
  }

  try {
    const body = (await response.json()) as ApiErrorBody & {
      requestId?: string
    }
    const message = Array.isArray(body.message)
      ? body.message.join('\n')
      : body.message

    return {
      code: body.code ?? `HTTP_${body.statusCode ?? response.status}`,
      message: message || body.error || fallbackMessage,
      requestId: body.requestId,
      statusCode: body.statusCode ?? response.status,
    }
  } catch {
    return {
      code: `HTTP_${response.status}`,
      message: fallbackMessage,
      statusCode: response.status,
    }
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
    throw new ApiError({
      code: 'AUTH_MISSING_SESSION',
      message: 'Missing active session.',
      statusCode: 401,
    })
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
    throw new ApiError(await readError(response))
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}
