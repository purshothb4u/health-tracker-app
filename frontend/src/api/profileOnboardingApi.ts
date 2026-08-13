import { get, put } from './client'
import type {
  ProfileOnboarding,
  ProfileOnboardingRequest,
} from '../types/ProfileOnboarding'

export function fetchProfileOnboarding(): Promise<ProfileOnboarding> {
  return get<ProfileOnboarding>('/api/profile-onboarding')
}

export function saveProfileOnboarding(
  request: ProfileOnboardingRequest,
): Promise<ProfileOnboarding> {
  return put<ProfileOnboarding>('/api/profile-onboarding', request)
}
