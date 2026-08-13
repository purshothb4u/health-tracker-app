import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchCurrentIdentity,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../api/authApi'
import { ApiError, clearCsrfToken, setUnauthorizedHandler } from '../api/client'
import type {
  AuthenticatedIdentity,
  LoginRequest,
  RegistrationRequest,
} from '../types/Auth'

interface AuthContextValue {
  identity: AuthenticatedIdentity | null
  authenticated: boolean
  restoring: boolean
  restoreError: string | null
  retryRestore: () => void
  login: (request: LoginRequest) => Promise<AuthenticatedIdentity>
  register: (request: RegistrationRequest) => Promise<AuthenticatedIdentity>
  refreshIdentity: () => Promise<AuthenticatedIdentity>
  logout: () => Promise<void>
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: AuthProviderProps) {
  const [identity, setIdentity] = useState<AuthenticatedIdentity | null>(null)
  const [restoring, setRestoring] = useState(true)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const restoreSequence = useRef(0)
  const initialRestoreStarted = useRef(false)

  const clearAuthentication = useCallback(() => {
    clearCsrfToken()
    setIdentity(null)
    setRestoreError(null)
    setRestoring(false)
  }, [])

  const restoreSession = useCallback(async () => {
    const sequence = ++restoreSequence.current
    setRestoring(true)
    setRestoreError(null)

    try {
      const currentIdentity = await fetchCurrentIdentity()
      if (sequence === restoreSequence.current) {
        setIdentity(currentIdentity)
      }
    } catch (error) {
      if (sequence !== restoreSequence.current) {
        return
      }

      setIdentity(null)
      if (!(error instanceof ApiError && error.status === 401)) {
        setRestoreError(
          error instanceof ApiError
            ? error.message
            : 'Unable to restore the current session',
        )
      }
    } finally {
      if (sequence === restoreSequence.current) {
        setRestoring(false)
      }
    }
  }, [])

  useEffect(() => setUnauthorizedHandler(clearAuthentication), [clearAuthentication])

  useEffect(() => {
    if (initialRestoreStarted.current) {
      return
    }
    initialRestoreStarted.current = true
    void restoreSession()
  }, [restoreSession])

  const login = useCallback(async (request: LoginRequest) => {
    const authenticatedIdentity = await loginRequest(request)
    ++restoreSequence.current
    setRestoreError(null)
    setRestoring(false)
    setIdentity(authenticatedIdentity)
    return authenticatedIdentity
  }, [])

  const register = useCallback(async (request: RegistrationRequest) => {
    const authenticatedIdentity = await registerRequest(request)
    ++restoreSequence.current
    setRestoreError(null)
    setRestoring(false)
    setIdentity(authenticatedIdentity)
    return authenticatedIdentity
  }, [])

  const refreshIdentity = useCallback(async () => {
    const sequence = ++restoreSequence.current
    const currentIdentity = await fetchCurrentIdentity()
    if (sequence === restoreSequence.current) {
      setRestoreError(null)
      setIdentity(currentIdentity)
    }
    return currentIdentity
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    ++restoreSequence.current
    clearAuthentication()
  }, [clearAuthentication])

  const value = useMemo<AuthContextValue>(() => ({
    identity,
    authenticated: identity !== null,
    restoring,
    restoreError,
    retryRestore: restoreSession,
    login,
    register,
    refreshIdentity,
    logout,
  }), [identity, login, logout, refreshIdentity, register, restoreError, restoreSession, restoring])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
