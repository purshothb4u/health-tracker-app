export interface AuthenticatedIdentity {
  email: string
  profileId: number
  displayName: string | null
  householdId: number
  profileComplete: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegistrationRequest {
  email: string
  password: string
}

export interface CsrfTokenResponse {
  headerName: string
  parameterName: string
  token: string
}
