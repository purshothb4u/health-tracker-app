import { get, post, put } from './client'
import type { UserProfile, UserProfileRequest } from '../types/UserProfile'

export function fetchUserProfiles(): Promise<UserProfile[]> {
  return get<UserProfile[]>('/api/users')
}

export function fetchUserProfile(id: number): Promise<UserProfile> {
  return get<UserProfile>(`/api/users/${id}`)
}

export function createUserProfile(data: UserProfileRequest): Promise<UserProfile> {
  return post<UserProfile>('/api/users', data)
}

export function updateUserProfile(id: number, data: UserProfileRequest): Promise<UserProfile> {
  return put<UserProfile>(`/api/users/${id}`, data)
}
