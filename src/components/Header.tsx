import React, { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { DataProcessor } from '../services/dataProcessor'
import { 
  ArrowPathIcon, 
  ArrowDownTrayIcon, 
  Cog6ToothIcon,
  ChevronDownIcon,
  MoonIcon,
  SunIcon 
} from '@heroicons/react/24/outline'
import { getStoredTheme, toggleTheme } from '../utils/theme'

const getRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }
  
  return date.toLocaleDateString()
}

export default function Header() {
  const { state, setApiKey, loadFactionData, clearCache, clearData, exportData } = useApp()
  const [apiKeyInput, setApiKeyInput] = useState(state.apiKey || '')
  const [showApiKeyModal, setShowApiKeyModal] = useState(!state.apiKey)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(() => getStoredTheme())

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('export-dropdown')
      if (dropdown && !dropdown.contains(event.target as Node)) {
        dropdown.classList.add('hidden')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close modal when clicking outside or pressing Esc
  useEffect(() => {
    if (!showApiKeyModal) return

    const handleClickOutside = (event: MouseEvent) => {
      const modal = document.querySelector('[data-modal="api-key"]')
      if (modal && !modal.contains(event.target as Node)) {
        setShowApiKeyModal(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowApiKeyModal(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showApiKeyModal])

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKeyInput.trim()) return

    setApiKey(apiKeyInput.trim())
    setShowApiKeyModal(false)
  }

  const handleLoadData = async () => {
    setIsLoadingData(true)
    await loadFactionData()
    setIsLoadingData(false)
  }

  const handleThemeToggle = () => {
    const newTheme = toggleTheme()
    setCurrentTheme(newTheme)
  }


  const quickStats = state.factionData
    ? DataProcessor.calculateQuickStats(state.filteredStats)
    : null

  return (
    <>
      <header className="pt-4 sm:pt-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-col sm:flex-row sm:h-16 sm:items-center sm:justify-between">
            <div className="flex items-center justify-between sm:justify-start">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                <span className="sm:hidden">Torn Respect</span>
                <span className="hidden sm:inline">Torn Faction Respect Tracker</span>
              </h1>
              <div className="flex items-center space-x-2 sm:hidden">
                <button
                  onClick={handleLoadData}
                  disabled={!state.apiClient || isLoadingData}
                  className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-orange-700 disabled:bg-gray-400"
                  title="Sync faction data"
                >
                  <ArrowPathIcon className={`h-3 w-3 ${isLoadingData ? 'animate-spin' : ''}`} />
                  {isLoadingData ? 'Syncing...' : 'Sync'}
                </button>
                {state.factionData && (
                  <button
                    onClick={() => exportData('csv')}
                    className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-green-700"
                    title="Export CSV"
                  >
                    <ArrowDownTrayIcon className="h-3 w-3" />
                    CSV
                  </button>
                )}
                <button
                  onClick={() => setShowApiKeyModal(true)}
                  className="rounded-lg p-1.5 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Settings"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {quickStats && (
              <div className="mt-2 sm:mt-0 sm:ml-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <span className="font-medium">
                    {quickStats.totalRespect.toLocaleString()}
                  </span>
                  <span className="ml-1 hidden sm:inline">Total Respect</span>
                  <span className="ml-1 sm:hidden">Respect</span>
                </div>
                <div>
                  <span className="font-medium">
                    {quickStats.totalAttacks.toLocaleString()}
                  </span>
                  <span className="ml-1 hidden sm:inline">Total Attacks</span>
                  <span className="ml-1 sm:hidden">Attacks</span>
                </div>
                <div>
                  <span className="font-medium">
                    {quickStats.averageSuccessRate.toFixed(1)}%
                  </span>
                  <span className="ml-1 hidden sm:inline">Success Rate</span>
                  <span className="ml-1 sm:hidden">Success</span>
                </div>
              </div>
            )}

            <div className="hidden sm:flex items-center space-x-4">
              {state.lastSync && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last sync: {getRelativeTime(state.lastSync)}
                </span>
              )}

              <button
                onClick={handleLoadData}
                disabled={!state.apiClient || isLoadingData}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-700 disabled:bg-gray-400"
                title="Sync faction data"
              >
                <ArrowPathIcon className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                {isLoadingData ? 'Syncing...' : 'Sync'}
              </button>

              {/* Export Dropdown - Desktop only */}
              <div className="relative">
                <button
                  onClick={() => {
                    const dropdown = document.getElementById('export-dropdown')
                    dropdown?.classList.toggle('hidden')
                  }}
                  disabled={!state.factionData}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:bg-gray-400"
                  title="Export data"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export
                  <ChevronDownIcon className="h-3 w-3" />
                </button>
                
                <div 
                  id="export-dropdown" 
                  className="absolute right-0 top-12 z-10 mt-1 w-40 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5 dark:ring-opacity-20 hidden"
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        exportData('csv')
                        document.getElementById('export-dropdown')?.classList.add('hidden')
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        exportData('json')
                        document.getElementById('export-dropdown')?.classList.add('hidden')
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                      Export JSON
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowApiKeyModal(true)}
                className="rounded-lg p-2 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
                title="Settings"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {state.loadingProgress && (
          <div className="border-t border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/50 px-4 py-3">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-700 dark:text-orange-300">
                  Loading faction data...{' '}
                  {state.loadingProgress.current.toLocaleString()} attacks processed
                  {state.loadingProgress.total 
                    ? ` / ${state.loadingProgress.total.toLocaleString()}`
                    : ' (fetching in batches...)'
                  }
                </span>
                <div className="h-2 w-64 rounded-full bg-orange-200 dark:bg-orange-800">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      state.loadingProgress.total ? 'bg-orange-600 dark:bg-orange-400' : 'bg-orange-600 dark:bg-orange-400 animate-pulse'
                    }`}
                    style={{
                      width: state.loadingProgress.total
                        ? `${
                            (state.loadingProgress.current / state.loadingProgress.total) *
                            100
                          }%`
                        : '50%'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {state.error && (
          <div className="border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/50 px-4 py-3">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center">
                <svg
                  className="mr-2 size-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-red-700 dark:text-red-300">{state.error}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6" data-modal="api-key">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Torn API Configuration
            </h2>
            <form onSubmit={handleApiKeySubmit}>
              <div className="mb-4">
                <label
                  htmlFor="apiKey"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter your Torn API key"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Your API key is stored locally and never sent to external
                  servers. Get your API key from your Torn preferences.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                {state.apiKey && (
                  <button
                    type="button"
                    onClick={() => setShowApiKeyModal(false)}
                    className="rounded-md bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
                >
                  Save
                </button>
              </div>
            </form>
            {state.apiKey && (
              <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Theme
                  </h3>
                  <button
                    onClick={handleThemeToggle}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    {currentTheme === 'dark' ? (
                      <>
                        <SunIcon className="h-4 w-4" />
                        Switch to Light Mode
                      </>
                    ) : (
                      <>
                        <MoonIcon className="h-4 w-4" />
                        Switch to Dark Mode
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Cache Management
                  </h3>
                  {state.hasCachedData && (
                    <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800 rounded-md">
                      <div className="flex items-start">
                        <svg className="h-4 w-4 text-orange-400 dark:text-orange-300 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                            Cached Data Available
                          </h4>
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                            Past attacks will show the same data. Clear cache only when switching factions or if data seems outdated.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {state.hasCachedData && (
                    <button
                      onClick={() => {
                        clearCache()
                        setShowApiKeyModal(false)
                      }}
                      className="text-sm font-medium text-orange-600 hover:text-orange-800 mb-2 block"
                    >
                      Clear Cache
                    </button>
                  )}
                </div>
                
                <div>
                  <button
                    onClick={clearData}
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Clear All Data & Settings
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This will remove your API key and all cached data.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
