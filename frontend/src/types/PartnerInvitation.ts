export interface PartnerInvitationCodeRequest {
  inviteCode: string
}

export interface PartnerInvitationCreated {
  inviteCode: string
  expiresAt: string
}

export interface PartnerInvitationStatus {
  active: boolean
  expiresAt: string | null
}

export interface PartnerInvitationPreview {
  inviterDisplayName: string
  expiresAt: string
}

export interface PartnerLink {
  partnerProfileId: number
  partnerDisplayName: string
}
