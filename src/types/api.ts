export type AttackResult =
  | 'Attacked'
  | 'Mugged'
  | 'Lost'
  | 'Hospitalized'
  | 'Assist'
  | 'Stalemate'
  | 'Timeout'
  | 'Special'
  | 'Interrupted'
  | 'Escape'
  | 'Arrested'

export type AttackType =
  | 'regular'
  | 'war'
  | 'chain'
  | 'bonus'
  | 'retaliation'
  | 'overseas'

export interface AttackData {
  id: number
  code: string
  started: number
  ended: number
  attacker: {
    id: number
    name: string
    level: number
    faction: { id: number; name: string }
  } | null
  defender: {
    id: number
    name: string
    level: number
    faction: { id: number; name: string } | null
  }
  result: AttackResult
  respect_gain: number
  respect_loss: number
  chain: number
  is_interrupted: boolean
  is_stealthed: boolean
  is_raid: boolean
  is_ranked_war: boolean
  modifiers: {
    fair_fight: number
    war: number
    retaliation: number
    group: number
    overseas: number
    chain: number
    warlord: number
  }
}

export interface ProcessedAttack extends AttackData {
  duration: number
  isWar: boolean
  isChain: boolean
  isBonusHit: boolean
  attackType: AttackType
}

export interface FactionMember {
  id: number
  name: string
  position: string
  level: number
  days_in_faction: number
  is_revivable: boolean
  is_on_wall: boolean
  is_in_oc: boolean
  has_early_discharge: boolean
  last_action: {
    status: string
    timestamp: number
    relative: string
  }
  status: {
    description: string
    details: string
    state: string
    color: string
    until: number
  }
  revive_setting: string
}

export interface MemberStats {
  memberId: number
  name: string
  level: number
  position?: string
  isCurrentMember: boolean
  daysInFaction?: number
  totalAttacks: number
  successfulAttacks: number
  totalRespect: number
  averageRespectPerAttack: number
  averageRespectPerSuccess: number
  bestSingleHit: number
  bestBonusHit: number
  successRate: number
  warAttacks: number
  warRespect: number
  chainAttacks: number
  chainRespect: number
  bonusHits: number
  stealthAttacks: number
  fairFightEfficiency: number
}

export interface APIResponse<T> {
  data: T
  _metadata: {
    links: {
      next?: string
      prev?: string
    }
    total: number
  }
}

export interface AttacksResponse {
  attacks: AttackData[]
  _metadata: {
    links: {
      next?: string
      prev?: string
    }
    total: number
  }
}

export interface MembersResponse {
  members: Record<string, FactionMember> | FactionMember[]
}

export interface FactionData {
  attacks: ProcessedAttack[]
  currentMembers: FactionMember[]
  memberStats: MemberStats[]
}
