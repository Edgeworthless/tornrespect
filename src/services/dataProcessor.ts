import {
  AttackData,
  ProcessedAttack,
  FactionMember,
  MemberStats,
  AttackResult,
  AttackType
} from '../types/api'
import { FilterState } from '../types/filters'

export class DataProcessor {
  private static readonly SUCCESSFUL_RESULTS: Set<AttackResult> = new Set([
    'Attacked',
    'Mugged',
    'Hospitalized'
  ])

  static processAttacks(
    attacks: AttackData[],
    currentMembers: FactionMember[]
  ): { processedAttacks: ProcessedAttack[]; memberStats: MemberStats[] } {
    // Filter out attacks with null attackers before processing
    // API already filters to outgoing attacks only, so all attackers should be faction members
    const validAttacks = attacks.filter(attack => attack.attacker && attack.attacker.id)
    
    console.log(`📊 Processing ${validAttacks.length} attacks for analysis`)
    
    const processedAttacks = validAttacks.map((attack) => this.enhanceAttack(attack))
    const memberStats = this.calculateMemberStats(
      processedAttacks,
      currentMembers
    )

    return { processedAttacks, memberStats }
  }

  private static enhanceAttack(attack: AttackData): ProcessedAttack {
    // At this point we know attacker is not null due to filtering
    if (!attack.attacker) {
      throw new Error('Attack missing attacker data')
    }
    
    const duration = attack.ended - attack.started
    // Use proper war detection: modifiers.war > 1 OR is_ranked_war flag
    const isWar = attack.modifiers.war > 1 || attack.is_ranked_war
    const isChain = attack.chain > 9  // Chain attacks are only when chain > 9
    const isBonusHit = this.detectBonusHit(attack)
    const attackType = this.categorizeAttack(attack)

    // Debug logging for war detection (first 5 only)
    if (isWar && Math.random() < 0.1) { // Show ~10% of war attacks to avoid spam
      console.log('🔍 WAR ATTACK:', {
        attacker: attack.attacker.name,
        defender: attack.defender.name,
        warModifier: attack.modifiers.war,
        isRankedWar: attack.is_ranked_war,
        respect: attack.respect_gain
      })
    }

    return {
      ...attack,
      duration,
      isWar,
      isChain,
      isBonusHit,
      attackType
    }
  }

  private static readonly BONUS_HIT_VALUES = new Set([
    10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240, 20480, 40960
  ])

  private static detectBonusHit(attack: AttackData): boolean {
    // Check if the exact respect gain matches known bonus hit values
    return this.BONUS_HIT_VALUES.has(attack.respect_gain)
  }

  private static categorizeAttack(attack: AttackData): AttackType {
    const hasRetaliation = attack.modifiers.retaliation > 1
    const hasOverseas = attack.modifiers.overseas > 1
    const isChain = attack.chain > 9  // Chain attacks are only when chain > 9
    // Use proper war detection: modifiers.war > 1 OR is_ranked_war flag
    const isWar = attack.modifiers.war > 1 || attack.is_ranked_war
    const isBonusHit = this.detectBonusHit(attack)
    
    if (hasRetaliation) return 'retaliation'
    if (hasOverseas) return 'overseas'
    if (isWar) return 'war'  // Check war before chain since war is more significant
    if (isChain) return 'chain'
    if (isBonusHit) return 'bonus'
    return 'regular'
  }

  private static calculateMemberStats(
    attacks: ProcessedAttack[],
    currentMembers: FactionMember[]
  ): MemberStats[] {
    // Ensure currentMembers is an array
    if (!Array.isArray(currentMembers)) {
      throw new Error('currentMembers must be an array')
    }
    
    const memberMap = new Map<number, MemberStats>()
    const currentMemberIds = new Set(currentMembers.map((m) => m.id))
    const currentMemberData = new Map(currentMembers.map((m) => [m.id, m]))

    attacks.forEach((attack) => {
      // Skip attacks with null or missing attacker data
      if (!attack.attacker || !attack.attacker.id) {
        return
      }
      
      const memberId = attack.attacker.id
      let stats = memberMap.get(memberId)

      if (!stats) {
        const memberData = currentMemberData.get(memberId)
        stats = this.initializeMemberStats(
          memberId,
          attack.attacker.name,
          attack.attacker.level,
          currentMemberIds.has(memberId),
          memberData
        )
        memberMap.set(memberId, stats)
      }

      this.updateStatsFromAttack(stats, attack)
    })

    return Array.from(memberMap.values())
      .map((stats) => this.finalizeStats(stats))
      .sort((a, b) => b.totalRespect - a.totalRespect)
  }

  private static initializeMemberStats(
    memberId: number,
    name: string,
    level: number,
    isCurrentMember: boolean,
    memberData?: FactionMember
  ): MemberStats {
    return {
      memberId,
      name,
      level,
      position: memberData?.position,
      isCurrentMember,
      daysInFaction: memberData?.days_in_faction,
      totalAttacks: 0,
      successfulAttacks: 0,
      totalRespect: 0,
      averageRespectPerAttack: 0,
      averageRespectPerSuccess: 0,
      bestSingleHit: 0,
      bestBonusHit: 0,
      successRate: 0,
      warAttacks: 0,
      warRespect: 0,
      chainAttacks: 0,
      chainRespect: 0,
      bonusHits: 0,
      stealthAttacks: 0,
      fairFightEfficiency: 1
    }
  }

  private static updateStatsFromAttack(
    stats: MemberStats,
    attack: ProcessedAttack
  ): void {
    stats.totalAttacks++

    const isSuccessful = this.SUCCESSFUL_RESULTS.has(attack.result)
    
    if (isSuccessful) {
      stats.successfulAttacks++
      stats.totalRespect += attack.respect_gain
      
      // Track best hits separately for regular and bonus (only on successful attacks)
      if (this.detectBonusHit(attack)) {
        stats.bestBonusHit = Math.max(stats.bestBonusHit, attack.respect_gain)
      } else {
        stats.bestSingleHit = Math.max(stats.bestSingleHit, attack.respect_gain)
      }
    }

    if (attack.isWar) {
      stats.warAttacks++
      if (isSuccessful) {
        stats.warRespect += attack.respect_gain
      }
    }

    if (attack.isChain) {
      stats.chainAttacks++
      if (isSuccessful) {
        stats.chainRespect += attack.respect_gain
      }
    }

    if (attack.isBonusHit) {
      stats.bonusHits++
    }

    if (attack.is_stealthed) {
      stats.stealthAttacks++
    }

    if (attack.modifiers.fair_fight > 1) {
      const currentTotal = stats.fairFightEfficiency * (stats.totalAttacks - 1)
      stats.fairFightEfficiency =
        (currentTotal + attack.modifiers.fair_fight) / stats.totalAttacks
    }
  }

  private static finalizeStats(stats: MemberStats): MemberStats {
    stats.successRate =
      stats.totalAttacks > 0
        ? (stats.successfulAttacks / stats.totalAttacks) * 100
        : 0

    stats.averageRespectPerAttack =
      stats.totalAttacks > 0 ? stats.totalRespect / stats.totalAttacks : 0

    stats.averageRespectPerSuccess =
      stats.successfulAttacks > 0
        ? stats.totalRespect / stats.successfulAttacks
        : 0

    return stats
  }

  static filterAttacks(
    attacks: ProcessedAttack[],
    filters: FilterState,
    currentMembers?: FactionMember[]
  ): ProcessedAttack[] {
    return attacks.filter((attack) => {
      if (!this.passesTimeFilter(attack, filters.time)) return false
      if (!this.passesAttackFilter(attack, filters.attacks)) return false
      if (!this.passesMemberFilter(attack, filters.members, currentMembers)) return false
      return true
    })
  }

  private static passesTimeFilter(
    attack: ProcessedAttack,
    timeFilter: FilterState['time']
  ): boolean {
    if (timeFilter.preset === 'custom') {
      if (timeFilter.from && attack.started < timeFilter.from.getTime() / 1000)
        return false
      if (timeFilter.to && attack.started > timeFilter.to.getTime() / 1000)
        return false
    } else {
      const now = Date.now() / 1000
      if (timeFilter.preset === 'all') {
        // No time filtering for 'all' preset
        return true
      }

      const timeRanges = {
        '1h': 3600,
        '6h': 21600,
        '24h': 86400,
        '7d': 604800,
        '30d': 2592000
      }

      const range = timeRanges[timeFilter.preset as keyof typeof timeRanges]
      if (range && attack.started < now - range) return false
    }

    return true
  }

  private static passesAttackFilter(
    attack: ProcessedAttack,
    attackFilter: FilterState['attacks']
  ): boolean {
    if (!attackFilter.attackTypes.includes(attack.attackType)) return false
    if (!attackFilter.results.includes(attack.result)) return false

    if (
      attackFilter.minFairFight !== undefined &&
      attack.modifiers.fair_fight < attackFilter.minFairFight
    )
      return false

    if (
      attackFilter.maxFairFight !== undefined &&
      attack.modifiers.fair_fight > attackFilter.maxFairFight
    )
      return false

    if (
      attackFilter.hasWarBonus !== undefined &&
      attack.modifiers.war > 1 !== attackFilter.hasWarBonus
    )
      return false

    if (
      attackFilter.hasOverseasBonus !== undefined &&
      attack.modifiers.overseas > 1 !== attackFilter.hasOverseasBonus
    )
      return false

    if (
      attackFilter.hasRetaliationBonus !== undefined &&
      attack.modifiers.retaliation > 1 !== attackFilter.hasRetaliationBonus
    )
      return false

    if (
      attackFilter.minChain !== undefined &&
      attack.chain < attackFilter.minChain
    )
      return false
    if (
      attackFilter.maxChain !== undefined &&
      attack.chain > attackFilter.maxChain
    )
      return false

    // Filter bonus hits based on includeBonusHits setting
    if (!attackFilter.includeBonusHits && this.detectBonusHit(attack))
      return false

    return true
  }

  private static passesMemberFilter(
    attack: ProcessedAttack,
    memberFilter: FilterState['members'],
    currentMembers?: FactionMember[]
  ): boolean {
    // Skip attacks with null attackers
    if (!attack.attacker) return false
    
    if (
      memberFilter.selectedMembers.length > 0 &&
      !memberFilter.selectedMembers.includes(attack.attacker.id)
    )
      return false

    if (memberFilter.searchQuery) {
      const query = memberFilter.searchQuery.toLowerCase()
      if (!attack.attacker.name.toLowerCase().includes(query)) return false
    }

    // Handle currentMembersOnly and formerMembersOnly filters
    if (currentMembers && (memberFilter.currentMembersOnly || memberFilter.formerMembersOnly)) {
      const isCurrentMember = currentMembers.some(member => member.id === attack.attacker.id)
      
      if (memberFilter.currentMembersOnly && !isCurrentMember) {
        return false
      }
      
      if (memberFilter.formerMembersOnly && isCurrentMember) {
        return false
      }
    }

    return true
  }

  static calculateQuickStats(memberStats: MemberStats[]): {
    totalAttacks: number
    totalRespect: number
    averageSuccessRate: number
    topPerformer: MemberStats | null
  } {
    if (memberStats.length === 0) {
      return {
        totalAttacks: 0,
        totalRespect: 0,
        averageSuccessRate: 0,
        topPerformer: null
      }
    }

    const totalAttacks = memberStats.reduce(
      (sum, stats) => sum + stats.totalAttacks,
      0
    )
    const totalRespect = memberStats.reduce(
      (sum, stats) => sum + stats.totalRespect,
      0
    )
    const averageSuccessRate =
      memberStats.reduce((sum, stats) => sum + stats.successRate, 0) /
      memberStats.length
    const topPerformer = memberStats[0]

    return {
      totalAttacks,
      totalRespect,
      averageSuccessRate,
      topPerformer
    }
  }
}
