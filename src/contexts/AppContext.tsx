import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect
} from 'react'
import { FactionData, MemberStats } from '../types/api'
import { FilterState, DEFAULT_FILTER_STATE } from '../types/filters'
import { TornAPIClient, TornAPIError } from '../services/api'
import { DataProcessor } from '../services/dataProcessor'

interface CachedFactionData {
  data: FactionData
  lastSync: Date
  apiKey: string
}

interface AppState {
  apiKey: string | null
  apiClient: TornAPIClient | null
  isLoading: boolean
  error: string | null
  factionData: FactionData | null
  filteredStats: MemberStats[]
  filters: FilterState
  lastSync: Date | null
  hasCachedData: boolean
}

type AppAction =
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FACTION_DATA'; payload: FactionData }
  | { type: 'SET_FILTERS'; payload: FilterState }
  | { type: 'SET_FILTERED_STATS'; payload: MemberStats[] }
  | { type: 'SET_LAST_SYNC'; payload: Date }
  | { type: 'LOAD_CACHED_DATA'; payload: CachedFactionData }
  | { type: 'SET_HAS_CACHED_DATA'; payload: boolean }
  | { type: 'CLEAR_DATA' }

interface AppContextType {
  state: AppState
  setApiKey: (key: string) => void
  loadFactionData: (
    onProgress?: (current: number, total?: number) => void
  ) => Promise<void>
  clearCache: () => void
  updateFilters: (filters: FilterState) => void
  clearData: () => void
  exportData: (format: 'csv' | 'json') => void
}

const CACHE_KEY = 'tornFactionDataCache'

const initialState: AppState = {
  apiKey: localStorage.getItem('tornApiKey'),
  apiClient: null,
  isLoading: false,
  error: null,
  factionData: null,
  filteredStats: [],
  filters: DEFAULT_FILTER_STATE,
  lastSync: null,
  hasCachedData: false
}

function getCachedData(apiKey: string): CachedFactionData | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const parsedCache = JSON.parse(cached)
    if (parsedCache.apiKey !== apiKey) return null
    
    return {
      ...parsedCache,
      lastSync: new Date(parsedCache.lastSync)
    }
  } catch {
    return null
  }
}

function setCachedData(data: FactionData, lastSync: Date, apiKey: string): void {
  try {
    const cacheData: CachedFactionData = {
      data,
      lastSync,
      apiKey
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // Ignore storage errors
  }
}

function clearCachedData(): void {
  sessionStorage.removeItem(CACHE_KEY)
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_API_KEY': {
      const client = action.payload ? new TornAPIClient(action.payload) : null
      localStorage.setItem('tornApiKey', action.payload)
      return {
        ...state,
        apiKey: action.payload,
        apiClient: client,
        error: null
      }
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }

    case 'SET_FACTION_DATA':
      return {
        ...state,
        factionData: action.payload,
        isLoading: false,
        error: null
      }

    case 'LOAD_CACHED_DATA':
      return {
        ...state,
        factionData: action.payload.data,
        lastSync: action.payload.lastSync,
        error: null
      }

    case 'SET_HAS_CACHED_DATA':
      return {
        ...state,
        hasCachedData: action.payload
      }

    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload
      }

    case 'SET_FILTERED_STATS':
      return {
        ...state,
        filteredStats: action.payload
      }

    case 'SET_LAST_SYNC':
      return {
        ...state,
        lastSync: action.payload
      }

    case 'CLEAR_DATA':
      localStorage.removeItem('tornApiKey')
      clearCachedData()
      return {
        ...initialState,
        apiKey: null,
        apiClient: null
      }

    default:
      return state
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    apiClient: initialState.apiKey
      ? new TornAPIClient(initialState.apiKey)
      : null,
    hasCachedData: initialState.apiKey ? !!getCachedData(initialState.apiKey) : false
  })

  // Auto-load cached data on mount if available
  useEffect(() => {
    if (state.apiKey && !state.factionData) {
      const cached = getCachedData(state.apiKey)
      if (cached) {
        dispatch({ type: 'LOAD_CACHED_DATA', payload: cached })
        
        // Apply current filters to cached data
        const filteredAttacks = DataProcessor.filterAttacks(
          cached.data.attacks,
          state.filters
        )
        const { memberStats: filteredStats } = DataProcessor.processAttacks(
          filteredAttacks,
          cached.data.currentMembers
        )
        dispatch({ type: 'SET_FILTERED_STATS', payload: filteredStats })
      }
    }
  }, [state.apiKey, state.factionData, state.filters])

  const setApiKey = useCallback((key: string) => {
    dispatch({ type: 'SET_API_KEY', payload: key })
    dispatch({ type: 'SET_HAS_CACHED_DATA', payload: !!getCachedData(key) })
  }, [])


  const clearCache = useCallback(() => {
    clearCachedData()
    dispatch({ type: 'SET_HAS_CACHED_DATA', payload: false })
  }, [])

  const loadFactionData = useCallback(
    async (onProgress?: (current: number, total?: number) => void) => {
      if (!state.apiClient) {
        dispatch({ type: 'SET_ERROR', payload: 'No API client available' })
        return
      }

      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      try {
        const timeFilter = state.filters.time
        let fromTimestamp: number | undefined
        let toTimestamp: number | undefined

        if (timeFilter.preset === 'custom') {
          fromTimestamp = timeFilter.from
            ? Math.floor(timeFilter.from.getTime() / 1000)
            : undefined
          toTimestamp = timeFilter.to
            ? Math.floor(timeFilter.to.getTime() / 1000)
            : undefined
        } else if (timeFilter.preset !== '30d' && timeFilter.preset !== 'all') {
          const timeRanges = {
            '1h': 3600,
            '6h': 21600,
            '24h': 86400,
            '7d': 604800
          }
          const range = timeRanges[timeFilter.preset as keyof typeof timeRanges]
          if (range) {
            fromTimestamp = Math.floor(Date.now() / 1000) - range
          }
        } else if (timeFilter.preset === '30d') {
          fromTimestamp = Math.floor(Date.now() / 1000) - 2592000 // 30 days
        }
        // For 'all' preset, we leave both timestamps undefined

        const { attacks, currentMembers } =
          await state.apiClient.fetchAllAttacks(
            fromTimestamp,
            toTimestamp,
            onProgress
          )

        const { processedAttacks, memberStats } = DataProcessor.processAttacks(
          attacks,
          currentMembers
        )

        const factionData: FactionData = {
          attacks: processedAttacks,
          currentMembers,
          memberStats
        }

        dispatch({ type: 'SET_FACTION_DATA', payload: factionData })
        const syncTime = new Date()
        dispatch({ type: 'SET_LAST_SYNC', payload: syncTime })
        
        // Cache the data
        if (state.apiKey) {
          setCachedData(factionData, syncTime, state.apiKey)
          dispatch({ type: 'SET_HAS_CACHED_DATA', payload: true })
        }

        const filteredAttacks = DataProcessor.filterAttacks(
          processedAttacks,
          state.filters
        )
        const { memberStats: filteredStats } = DataProcessor.processAttacks(
          filteredAttacks,
          currentMembers
        )
        dispatch({ type: 'SET_FILTERED_STATS', payload: filteredStats })
      } catch (error) {
        console.error('Failed to load faction data:', error)
        let errorMessage = 'Failed to load faction data'

        if (error instanceof TornAPIError) {
          errorMessage = error.message
        } else if (error instanceof Error) {
          errorMessage = error.message
        }

        dispatch({ type: 'SET_ERROR', payload: errorMessage })
      }
    },
    [state.apiClient, state.filters]
  )

  const updateFilters = useCallback(
    (filters: FilterState) => {
      dispatch({ type: 'SET_FILTERS', payload: filters })

      if (state.factionData) {
        const filteredAttacks = DataProcessor.filterAttacks(
          state.factionData.attacks,
          filters
        )
        const { memberStats: filteredStats } = DataProcessor.processAttacks(
          filteredAttacks,
          state.factionData.currentMembers
        )
        dispatch({ type: 'SET_FILTERED_STATS', payload: filteredStats })
      }
    },
    [state.factionData]
  )

  const clearData = useCallback(() => {
    dispatch({ type: 'CLEAR_DATA' })
  }, [])

  const exportData = useCallback(
    (format: 'csv' | 'json') => {
      if (!state.factionData) return

      const data = state.filteredStats
      let content: string
      let filename: string
      let mimeType: string

      if (format === 'csv') {
        const headers = [
          'Member',
          'Status',
          'Level',
          'Position',
          'Total Attacks',
          'Success Rate (%)',
          'Total Respect',
          'Avg/Attack',
          'War Attacks',
          'War Respect',
          'Chain Attacks',
          'Chain Respect',
          'Bonus Hits',
          'Best Hit',
          'Fair Fight Avg'
        ]

        const rows = data.map((stats) => [
          stats.name,
          stats.isCurrentMember ? 'Current' : 'Former',
          stats.level.toString(),
          stats.position || '',
          stats.totalAttacks.toString(),
          stats.successRate.toFixed(1),
          stats.totalRespect.toFixed(2),
          stats.averageRespectPerAttack.toFixed(2),
          stats.warAttacks.toString(),
          stats.warRespect.toFixed(2),
          stats.chainAttacks.toString(),
          stats.chainRespect.toFixed(2),
          stats.bonusHits.toString(),
          stats.bestBonusHit > 0 
            ? `${stats.bestSingleHit.toFixed(2)} (${stats.bestBonusHit})`
            : stats.bestSingleHit.toFixed(2),
          stats.fairFightEfficiency.toFixed(2)
        ])

        content = [headers, ...rows].map((row) => row.join(',')).join('\n')
        filename = `faction-respect-${
          new Date().toISOString().split('T')[0]
        }.csv`
        mimeType = 'text/csv'
      } else {
        content = JSON.stringify(data, null, 2)
        filename = `faction-respect-${
          new Date().toISOString().split('T')[0]
        }.json`
        mimeType = 'application/json'
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    [state.filteredStats, state.factionData]
  )

  const contextValue: AppContextType = {
    state,
    setApiKey,
    loadFactionData,
    clearCache,
    updateFilters,
    clearData,
    exportData
  }

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
