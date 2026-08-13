import { clearCsrfToken, get, getCsrfToken, post } from './client'
import type {
  AuthenticatedIdentity,
  CsrfTokenResponse,
  LoginRequest,
  RegistrationRequest,
} from '../types/Auth'

export function fetchCsrfToken(forceRefresh = false): Promise<CsrfTokenResponse> {
  return getCsrfToken(forceRefresh)
}

export async function login(request: LoginRequest): Promise<AuthenticatedIdentity> {
  const identity = await post<AuthenticatedIdentity>('/api/auth/login', request, {
    notifyOnUnauthorized: false,
  })
  clearCsrfToken()
  return identity
}

export async function register(
  request: RegistrationRequest,
): Promise<AuthenticatedIdentity> {
  const identity = await post<AuthenticatedIdentity>('/api/auth/register', request, {
    notifyOnUnauthorized: false,
  })
  clearCsrfToken()
  return identity
}

export function fetchCurrentIdentity(): Promise<AuthenticatedIdentity> {
  return get<AuthenticatedIdentity>('/api/auth/me', {
    notifyOnUnauthorized: false,
  })
}

export async function logout(): Promise<void> {
  await post<void>('/api/auth/logout', undefined)
  clearCsrfToken()
}
