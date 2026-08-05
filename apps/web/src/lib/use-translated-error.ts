import type { TranslationKey } from '@/i18n/dictionaries'
import { useI18n } from '@/i18n/i18n-context'
import { ApiError } from '@/lib/api'

const apiErrorKeys: Record<string, TranslationKey> = {
  AUTH_MISSING_SESSION: 'errors.authMissingSession',
  DATABASE_CONFLICT: 'errors.databaseConflict',
  DATABASE_RECORD_NOT_FOUND: 'errors.databaseRecordNotFound',
  DATABASE_INVALID_DATA: 'errors.databaseInvalidData',
  DATABASE_QUERY_VALIDATION_ERROR: 'errors.invalidRequest',
  DATABASE_CONNECTION_UNAVAILABLE: 'errors.databaseUnavailable',
  DATABASE_ERROR: 'errors.databaseError',
  HTTP_400: 'errors.invalidRequest',
  HTTP_401: 'errors.unauthorized',
  HTTP_403: 'errors.forbidden',
  HTTP_404: 'errors.notFound',
  HTTP_409: 'errors.conflict',
  HTTP_429: 'errors.tooManyRequests',
  HTTP_500: 'errors.serverError',
  HTTP_503: 'errors.serviceUnavailable',
}

export function useTranslatedError() {
  const { t } = useI18n()

  return (
    error: unknown,
    fallbackKey: TranslationKey = 'errors.default',
  ) => {
    if (error instanceof ApiError) {
      return t(apiErrorKeys[error.code] ?? fallbackKey)
    }

    return t(fallbackKey)
  }
}
