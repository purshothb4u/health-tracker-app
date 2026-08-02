import { del, get, post, put } from './client'
import type {
  Achievement,
  ChallengeCheckIn,
  ChallengeStatus,
  ChallengeStatusRequest,
  CoupleChallenge,
  CoupleChallengeProgress,
  CoupleChallengeRequest,
  ProgressCheckInRequest,
} from '../types/CoupleChallenge'

const CHALLENGES_PATH = '/api/couple-challenges'

export function createCoupleChallenge(data: CoupleChallengeRequest): Promise<CoupleChallenge> {
  return post<CoupleChallenge>(CHALLENGES_PATH, data)
}

export function fetchCoupleChallenges(
  status?: ChallengeStatus | null,
): Promise<CoupleChallenge[]> {
  const query = status === undefined || status === null
    ? ''
    : `?status=${encodeURIComponent(status)}`
  return get<CoupleChallenge[]>(`${CHALLENGES_PATH}${query}`)
}

export function fetchCoupleChallenge(challengeId: number): Promise<CoupleChallenge> {
  return get<CoupleChallenge>(`${CHALLENGES_PATH}/${challengeId}`)
}

export function updateCoupleChallenge(
  challengeId: number,
  data: CoupleChallengeRequest,
): Promise<CoupleChallenge> {
  return put<CoupleChallenge>(`${CHALLENGES_PATH}/${challengeId}`, data)
}

export function updateCoupleChallengeStatus(
  challengeId: number,
  data: ChallengeStatusRequest,
): Promise<CoupleChallenge> {
  return put<CoupleChallenge>(`${CHALLENGES_PATH}/${challengeId}/status`, data)
}

export function deleteCoupleChallenge(challengeId: number): Promise<void> {
  return del<void>(`${CHALLENGES_PATH}/${challengeId}`)
}

export function fetchCoupleChallengeProgress(
  challengeId: number,
): Promise<CoupleChallengeProgress> {
  return get<CoupleChallengeProgress>(`${CHALLENGES_PATH}/${challengeId}/progress`)
}

export function upsertChallengeCheckIn(
  challengeId: number,
  participantUserProfileId: number,
  date: string,
  data: ProgressCheckInRequest,
): Promise<ChallengeCheckIn> {
  return put<ChallengeCheckIn>(
    `${CHALLENGES_PATH}/${challengeId}/participants/${participantUserProfileId}`
      + `/check-ins/${encodeURIComponent(date)}`,
    data,
  )
}

export function fetchCoupleAchievements(userProfileId: number): Promise<Achievement[]> {
  return get<Achievement[]>(`/api/users/${userProfileId}/couple-achievements`)
}
