import { get } from './client'
import type { DailyTargets } from '../types/DailyTargets'

export function fetchDailyTargets(): Promise<DailyTargets> {
  return get<DailyTargets>('/api/daily-targets')
}
