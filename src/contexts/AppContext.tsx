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
import { useToast } from '../components/ToastContainer'

interface CachedFactionData {
  data: FactionData
  lastSync: Date
  apiKey: string
}

interface AppState {
  apiKey: string | null
  apiClient: TornAPIClient | null
  isLoading: boolean
  loadingProgress: { current: number; total?: number } | null
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
  | { type: 'SET_LOADING_PROGRESS'; payload: { current: number; total?: number } | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FACTION_DATA'; payload: FactionData | null }
  | { type: 'SET_FILTERS'; payload: FilterState }
  | { type: 'SET_FILTERED_STATS'; payload: MemberStats[] }
  | { type: 'SET_LAST_SYNC'; payload: Date | null }
  | { type: 'LOAD_CACHED_DATA'; payload: CachedFactionData }
  | { type: 'SET_HAS_CACHED_DATA'; payload: boolean }
  | { type: 'CLEAR_DATA' }

interface AppContextType {
  state: AppState
  setApiKey: (key: string) => void
  loadFactionData: (
    onProgress?: (current: number, total?: number) => void
  ) => Promise<void>
  syncIncrementalData: (
    newTimeFilter: FilterState['time'],
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
  loadingProgress: null,
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
        isLoading: action.payload,
        loadingProgress: action.payload ? state.loadingProgress : null
      }

    case 'SET_LOADING_PROGRESS':
      return {
        ...state,
        loadingProgress: action.payload
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
  const { showToast, updateToast, hideToast } = useToast()
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
    dispatch({ type: 'SET_FACTION_DATA', payload: null })
    dispatch({ type: 'SET_FILTERED_STATS', payload: [] })
    dispatch({ type: 'SET_LAST_SYNC', payload: null })
  }, [])

  const loadFactionData = useCallback(
    async (onProgress?: (current: number, total?: number) => void) => {
      if (!state.apiClient) {
        dispatch({ type: 'SET_ERROR', payload: 'No API client available' })
        return
      }

      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      const toastId = showToast({
        type: 'loading',
        title: 'Syncing faction data...',
        message: 'Fetching attack data and member information'
      })

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
            (current, total) => {
              updateToast(toastId, {
                progress: { current, total }
              })
              onProgress?.(current, total)
            }
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
        
        // Show success toast and hide loading toast
        hideToast(toastId)
        showToast({
          type: 'success',
          title: 'Sync completed',
          message: `Processed ${attacks.length.toLocaleString()} attacks`,
          duration: 3000
        })
      } catch (error) {
        console.error('Failed to load faction data:', error)
        let errorMessage = 'Failed to load faction data'

        if (error instanceof TornAPIError) {
          errorMessage = error.message
        } else if (error instanceof Error) {
          errorMessage = error.message
        }

        // Show error toast and hide loading toast
        hideToast(toastId)
        showToast({
          type: 'error',
          title: 'Sync failed',
          message: errorMessage,
          duration: 5000
        })
        
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
      }
    },
    [state.apiClient, state.filters, showToast, updateToast, hideToast]
  )

  const syncIncrementalData = useCallback(
    async (
      newTimeFilter: FilterState['time'],
      onProgress?: (current: number, total?: number) => void
    ) => {
      if (!state.apiClient || !state.factionData) {
        // If no cached data, fall back to full sync
        const newFilters = { ...state.filters, time: newTimeFilter }
        dispatch({ type: 'SET_FILTERS', payload: newFilters })
        return loadFactionData(onProgress)
      }

      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      let updatedFactionData: FactionData | null = null
      
      const toastId = showToast({
        type: 'loading',
        title: 'Updating data range...',
        message: 'Fetching additional attack data'
      })

      try {
        // Calculate what time range we need to fetch
        let fromTimestamp: number | undefined
        let toTimestamp: number | undefined
        let needsFetch = false

        // Determine the new time range needed
        if (newTimeFilter.preset === 'custom') {
          fromTimestamp = newTimeFilter.from
            ? Math.floor(newTimeFilter.from.getTime() / 1000)
            : undefined
          toTimestamp = newTimeFilter.to
            ? Math.floor(newTimeFilter.to.getTime() / 1000)
            : undefined
          needsFetch = true
        } else if (newTimeFilter.preset !== '30d' && newTimeFilter.preset !== 'all') {
          const timeRanges = {
            '1h': 3600,
            '6h': 21600,
            '24h': 86400,
            '7d': 604800
          }
          const range = timeRanges[newTimeFilter.preset as keyof typeof timeRanges]
          if (range) {
            fromTimestamp = Math.floor(Date.now() / 1000) - range
            needsFetch = true
          }
        } else if (newTimeFilter.preset === '30d') {
          fromTimestamp = Math.floor(Date.now() / 1000) - 2592000 // 30 days
          needsFetch = true
        } else {
          // 'all' preset - check if we have all data or need more
          needsFetch = true
        }

        // Check if we need to fetch new data beyond what we have cached
        const cachedAttacks = state.factionData.attacks
        const oldestCached = cachedAttacks.length > 0 
          ? Math.min(...cachedAttacks.map(a => a.started))
          : Math.floor(Date.now() / 1000)
        const newestCached = cachedAttacks.length > 0 
          ? Math.max(...cachedAttacks.map(a => a.started))
          : 0

        // Determine if we need to fetch additional data
        const needsOlderData = fromTimestamp && fromTimestamp < oldestCached
        const needsNewerData = !toTimestamp || (toTimestamp > newestCached && 
          (Date.now() / 1000 - newestCached) > 300) // Only fetch if more than 5 minutes old

        if (needsFetch && (needsOlderData || needsNewerData)) {
          // Fetch only the missing data ranges
          let newAttacks: any[] = []
          
          if (needsOlderData && fromTimestamp) {
            // Fetch older data
            const { attacks: olderAttacks } = await state.apiClient.fetchAllAttacks(
              fromTimestamp,
              oldestCached - 1,
              (current, total) => {
                updateToast(toastId, {
                  progress: { current, total }
                })
                onProgress?.(current, total)
              }
            )
            newAttacks.push(...olderAttacks)
          }

          if (needsNewerData) {
            // Fetch newer data
            const { attacks: newerAttacks } = await state.apiClient.fetchAllAttacks(
              newestCached + 1,
              toTimestamp,
              (current, total) => {
                updateToast(toastId, {
                  progress: { current, total }
                })
                onProgress?.(current, total)
              }
            )
            newAttacks.push(...newerAttacks)
          }

          // Merge new attacks with cached data
          if (newAttacks.length > 0) {
            const mergedAttacks = [...cachedAttacks, ...newAttacks]
              .sort((a, b) => b.started - a.started) // Sort by newest first
              .filter((attack, index, arr) => 
                // Remove duplicates based on attack ID
                arr.findIndex(a => a.code === attack.code) === index
              )

            // Update faction data with merged attacks
            const { processedAttacks, memberStats } = DataProcessor.processAttacks(
              mergedAttacks,
              state.factionData.currentMembers
            )

            updatedFactionData = {
              ...state.factionData,
              attacks: processedAttacks,
              memberStats
            }

            dispatch({ type: 'SET_FACTION_DATA', payload: updatedFactionData })
            
            const syncTime = new Date()
            dispatch({ type: 'SET_LAST_SYNC', payload: syncTime })
            
            // Update cache
            if (state.apiKey) {
              setCachedData(updatedFactionData, syncTime, state.apiKey)
            }
          }
        }

        // Update filters and filtered stats
        const newFilters = { ...state.filters, time: newTimeFilter }
        dispatch({ type: 'SET_FILTERS', payload: newFilters })

        // Recalculate filtered stats with new time filter
        // Use the most current faction data (either updated or existing)
        const currentData = updatedFactionData || state.factionData
        const filteredAttacks = DataProcessor.filterAttacks(
          currentData.attacks,
          newFilters,
          currentData.currentMembers
        )
        const { memberStats: filteredStats } = DataProcessor.processAttacks(
          filteredAttacks,
          currentData.currentMembers
        )
        dispatch({ type: 'SET_FILTERED_STATS', payload: filteredStats })

        // Show success toast
        updateToast(toastId, {
          type: 'success',
          title: 'Sync completed!',
          message: `Updated data for ${newTimeFilter.preset === 'custom' ? 'custom time range' : newTimeFilter.preset}`
        })
      } catch (error) {
        console.error('Failed to sync incremental data:', error)
        let errorMessage = 'Failed to sync data'

        if (error instanceof TornAPIError) {
          errorMessage = error.message
        } else if (error instanceof Error) {
          errorMessage = error.message
        }

        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        
        // Show error toast
        updateToast(toastId, {
          type: 'error',
          title: 'Sync failed',
          message: errorMessage
        })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [state.apiClient, state.factionData, state.filters, state.apiKey, loadFactionData, showToast, updateToast]
  )

  const updateFilters = useCallback(
    (filters: FilterState) => {
      dispatch({ type: 'SET_FILTERS', payload: filters })

      if (state.factionData) {
        const filteredAttacks = DataProcessor.filterAttacks(
          state.factionData.attacks,
          filters,
          state.factionData.currentMembers
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
    syncIncrementalData,
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
