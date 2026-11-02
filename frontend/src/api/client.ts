import axios, { AxiosError } from 'axios'
import type { ApiErrorBody, ApiValidationError } from './types'

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase()
  if (!['get', 'head', 'options'].includes(method)) {
    const csrf = readCookie('csrf_token')
    if (csrf) config.headers.set('X-CSRF-Token', csrf)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new CustomEvent('mediqueue:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return error.code === 'ECONNABORTED'
        ? 'The request took too long. Please try again.'
        : 'Unable to reach the server. Check your connection and try again.'
    }
    const detail = error.response.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const first = detail[0] as ApiValidationError | undefined
      if (first?.msg) return first.msg
    }
    if (typeof error.response.data?.message === 'string') return error.response.data.message
    if (error.response.status === 429) return 'Too many attempts. Please wait a moment and try again.'
    if (error.response.status >= 500) return 'Something went wrong on our side. Please try again.'
    return 'The request could not be completed.'
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
