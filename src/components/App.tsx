import { useEffect } from 'react'
import { AppProvider, useApp } from '../contexts/AppContext'
import Header from './Header'
import FilterPanel from './FilterPanel'
import MemberPerformanceTable from './MemberPerformanceTable'
import Charts from './Charts'
import Footer from './Footer'
import { DataProcessor } from '../services/dataProcessor'
import { initializeTheme } from '../utils/theme'

function Dashboard() {
  const { state } = useApp()

  const filteredAttacks = state.factionData
    ? DataProcessor.filterAttacks(state.factionData.attacks, state.filters)
    : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      <FilterPanel />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {state.isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading faction data...</p>
            </div>
          ) : state.factionData ? (
            <>
              <Charts
                memberStats={state.filteredStats}
                attacks={filteredAttacks}
              />
              <MemberPerformanceTable memberStats={state.filteredStats} />
            </>
          ) : (
            <div className="py-12 text-center">
              <svg
                className="mx-auto mb-4 size-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Welcome to Torn Faction Respect Tracker
              </h3>
              <p className="mx-auto mb-6 max-w-md text-gray-600">
                Configure your Torn API key and sync faction data to start
                analyzing member performance and respect contributions.
              </p>
              <div className="mx-auto max-w-lg space-y-4 text-left text-sm text-gray-500">
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5 flex size-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">
                      Configure API Key
                    </p>
                    <p>
                      Click the settings icon in the header to enter your Torn
                      API key
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5 flex size-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Sync Data</p>
                    <p>
                      Click &quot;Sync Data&quot; to fetch faction attack data
                      and member information
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5 flex size-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">
                      Analyze Performance
                    </p>
                    <p>
                      Use filters to analyze specific time periods, members, or
                      attack types
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  useEffect(() => {
    // Initialize theme on app load
    initializeTheme()
  }, [])

  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  )
}

export default App
