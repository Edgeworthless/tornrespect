import { AttackType, AttackResult } from './api'

export interface TimeFilter {
  preset: 'custom' | '1h' | '6h' | '24h' | '7d' | '30d' | 'all'
  from?: Date
  to?: Date
}

export interface MemberFilter {
  selectedMembers: number[]
  currentMembersOnly: boolean
  formerMembersOnly: boolean
  searchQuery: string
}

export interface AttackFilter {
  attackTypes: AttackType[]
  results: AttackResult[]
  minFairFight?: number
  maxFairFight?: number
  hasWarBonus?: boolean
  hasOverseasBonus?: boolean
  hasRetaliationBonus?: boolean
  minChain?: number
  maxChain?: number
  includeBonusHits: boolean
}

export interface FilterState {
  time: TimeFilter
  members: MemberFilter
  attacks: AttackFilter
}

const TIME_FILTER_STORAGE_KEY = 'tornRespectTimeFilter'

function getStoredTimeFilter(): TimeFilter {
  try {
    const stored = localStorage.getItem(TIME_FILTER_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        preset: parsed.preset || '24h',
        from: parsed.from ? new Date(parsed.from) : undefined,
        to: parsed.to ? new Date(parsed.to) : undefined
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return { preset: '24h' }
}

export function saveTimeFilter(timeFilter: TimeFilter): void {
  try {
    localStorage.setItem(TIME_FILTER_STORAGE_KEY, JSON.stringify(timeFilter))
  } catch {
    // Ignore storage errors
  }
}

export const DEFAULT_FILTER_STATE: FilterState = {
  time: getStoredTimeFilter(),
  members: {
    selectedMembers: [],
    currentMembersOnly: false,
    formerMembersOnly: false,
    searchQuery: ''
  },
  attacks: {
    attackTypes: [
      'regular',
      'war',
      'chain',
      'bonus',
      'retaliation',
      'overseas'
    ],
    results: [
      'Attacked',
      'Mugged',
      'Hospitalized',
      'Lost',
      'Assist',
      'Stalemate',
      'Timeout',
      'Special',
      'Interrupted',
      'Escape',
      'Arrested'
    ],
    includeBonusHits: true
  }
}
