import type { StatusResponse } from '../types/api'
import type { CsrfTokenResponse } from '../types/Auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ErrorBody {
  message?: string
  errors?: Record<string, string>
}

interface RequestBehavior {
  notifyOnUnauthorized?: boolean
  skipCsrf?: boolean
}

type UnauthorizedHandler = () => void

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

let csrfToken: CsrfTokenResponse | null = null
let csrfTokenRequest: Promise<CsrfTokenResponse> | null = null
let unauthorizedHandler: UnauthorizedHandler | null = null

async function parseError(response: Response): Promise<ErrorBody> {
  try {
    return (await response.json()) as ErrorBody
  } catch {
    // ignore JSON parse errors
  }
  return { message: `Request failed with status ${response.status}` }
}

export function clearCsrfToken(): void {
  csrfToken = null
  csrfTokenRequest = null
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
  unauthorizedHandler = handler
  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null
    }
  }
}

export async function getCsrfToken(forceRefresh = false): Promise<CsrfTokenResponse> {
  if (forceRefresh) {
    clearCsrfToken()
  }

  if (csrfToken !== null) {
    return csrfToken
  }

  if (csrfTokenRequest !== null) {
    return csrfTokenRequest
  }

  csrfTokenRequest = request<CsrfTokenResponse>('/api/auth/csrf', {
    notifyOnUnauthorized: false,
    skipCsrf: true,
  })

  try {
    csrfToken = await csrfTokenRequest
    return csrfToken
  } finally {
    csrfTokenRequest = null
  }
}

async function request<T>(
  path: string,
  options?: RequestInit & RequestBehavior,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const {
    notifyOnUnauthorized = true,
    skipCsrf = false,
    ...requestOptions
  } = options ?? {}
  const method = (requestOptions.method ?? 'GET').toUpperCase()
  const headers = new Headers(requestOptions.headers)

  if (requestOptions.body !== undefined && requestOptions.body !== null) {
    headers.set('Content-Type', 'application/json')
  }

  if (!skipCsrf && STATE_CHANGING_METHODS.has(method)) {
    const token = await getCsrfToken()
    headers.set(token.headerName, token.token)
  }

  const response = await fetch(url, {
    ...requestOptions,
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    const errorBody = await parseError(response)
    if (response.status === 403 && STATE_CHANGING_METHODS.has(method)) {
      clearCsrfToken()
    }
    if (response.status === 401 && notifyOnUnauthorized) {
      unauthorizedHandler?.()
    }
    throw new ApiError(
      errorBody.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorBody.errors,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function get<T>(path: string, behavior?: RequestBehavior): Promise<T> {
  return request<T>(path, behavior)
}

export function post<T>(
  path: string,
  body: unknown,
  behavior?: RequestBehavior,
): Promise<T> {
  return request<T>(path, {
    ...behavior,
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function put<T>(
  path: string,
  body: unknown,
  behavior?: RequestBehavior,
): Promise<T> {
  return request<T>(path, {
    ...behavior,
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function patch<T>(
  path: string,
  body: unknown,
  behavior?: RequestBehavior,
): Promise<T> {
  return request<T>(path, {
    ...behavior,
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function del<T>(path: string, behavior?: RequestBehavior): Promise<T> {
  return request<T>(path, {
    ...behavior,
    method: 'DELETE',
  })
}

export function getBackendStatus(): Promise<StatusResponse> {
  return get<StatusResponse>('/api/status')
}
