import { del, get, post } from './client'
import type {
  PartnerInvitationCodeRequest,
  PartnerInvitationCreated,
  PartnerInvitationPreview,
  PartnerInvitationStatus,
  PartnerLink,
} from '../types/PartnerInvitation'

const PARTNER_INVITATIONS_PATH = '/api/partner-invitations'

export function createPartnerInvitation(): Promise<PartnerInvitationCreated> {
  return post<PartnerInvitationCreated>(PARTNER_INVITATIONS_PATH, undefined)
}

export function fetchActivePartnerInvitation(): Promise<PartnerInvitationStatus> {
  return get<PartnerInvitationStatus>(`${PARTNER_INVITATIONS_PATH}/active`)
}

export function revokeActivePartnerInvitation(): Promise<void> {
  return del<void>(`${PARTNER_INVITATIONS_PATH}/active`)
}

export function previewPartnerInvitation(
  request: PartnerInvitationCodeRequest,
): Promise<PartnerInvitationPreview> {
  return post<PartnerInvitationPreview>(`${PARTNER_INVITATIONS_PATH}/preview`, request)
}

export function acceptPartnerInvitation(
  request: PartnerInvitationCodeRequest,
): Promise<PartnerLink> {
  return post<PartnerLink>(`${PARTNER_INVITATIONS_PATH}/accept`, request)
}
