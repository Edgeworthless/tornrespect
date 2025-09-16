import { useState, useMemo, useRef } from 'react'
import { MemberStats } from '../types/api'

interface Props {
  memberStats: MemberStats[]
}

type SortKey = keyof MemberStats
type SortDirection = 'asc' | 'desc'

interface SortConfig {
  key: SortKey
  direction: SortDirection
}

export default function MemberPerformanceTable({ memberStats }: Props) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'totalRespect',
    direction: 'desc'
  })
  const scrollRef = useRef<HTMLDivElement>(null)

  const sortedStats = useMemo(() => {
    const sorted = [...memberStats].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue === bValue) return 0

      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        comparison = aValue === bValue ? 0 : aValue ? 1 : -1
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison
    })

    return sorted
  }, [memberStats, sortConfig])

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) {
      return (
        <svg
          className="size-4 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )
    }

    return sortConfig.direction === 'desc' ? (
      <svg
        className="size-4 text-orange-600 dark:text-orange-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7-7-7 7"
        />
      </svg>
    ) : (
      <svg
        className="size-4 text-orange-600 dark:text-orange-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7 7 7-7"
        />
      </svg>
    )
  }

  const formatNumber = (value: number, decimals: number = 0): string => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  if (memberStats.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center shadow-sm">
        <svg
          className="mx-auto mb-4 size-12 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
          No Data Available
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Your filters are filtering too much bruh.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Member Performance
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {memberStats.length} members • Sorted by {sortConfig.key} (
              {sortConfig.direction})
            </p>
          </div>
          <div className="hidden md:flex space-x-2">
            <button
              onClick={scrollLeft}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Scroll left"
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={scrollRight}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Scroll right"
            >
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto scroll-smooth" ref={scrollRef}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="cursor-pointer select-none px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-1">
                  <span>Member</span>
                  <SortIcon column="name" />
                </div>
              </th>
              <th
                onClick={() => handleSort('totalAttacks')}
                className="cursor-pointer select-none px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-1">
                  <span>Attacks</span>
                  <SortIcon column="totalAttacks" />
                </div>
              </th>
              <th
                onClick={() => handleSort('successRate')}
                className="cursor-pointer select-none px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-1">
                  <span>Success %</span>
                  <SortIcon column="successRate" />
                </div>
              </th>
              <th
                onClick={() => handleSort('totalRespect')}
                className="cursor-pointer select-none px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-1">
                  <span>Total Respect</span>
                  <SortIcon column="totalRespect" />
                </div>
              </th>
              <th
                onClick={() => handleSort('averageRespectPerAttack')}
                className="cursor-pointer select-none px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-1">
                  <span>Avg</span>
                  <SortIcon column="averageRespectPerAttack" />
                </div>
              </th>
              <th
                onClick={() => handleSort('warRespect')}
                className="cursor-pointer select-none px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-1">
                  <span>War Respect</span>
                  <SortIcon column="warRespect" />
                </div>
              </th>
              <th
                onClick={() => handleSort('chainRespect')}
                className="cursor-pointer select-none px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-1">
                  <span>Chain Respect</span>
                  <SortIcon column="chainRespect" />
                </div>
              </th>
              <th
                onClick={() => handleSort('bonusHits')}
                className="cursor-pointer select-none px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-1">
                  <span>Bonus Hits</span>
                  <SortIcon column="bonusHits" />
                </div>
              </th>
              <th
                onClick={() => handleSort('bestSingleHit')}
                className="cursor-pointer select-none px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-1">
                  <span>Best Hit</span>
                  <SortIcon column="bestSingleHit" />
                </div>
              </th>
              <th
                onClick={() => handleSort('fairFightEfficiency')}
                className="cursor-pointer select-none px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-1">
                  <span>FF Avg</span>
                  <SortIcon column="fairFightEfficiency" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {sortedStats.map((stats, index) => (
              <tr
                key={stats.memberId}
                className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {stats.name}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Level {stats.level}</span>
                        {stats.isCurrentMember ? (
                          stats.position && (
                            <span className="ml-1 text-orange-600 dark:text-orange-400 font-medium">
                              • {stats.position}
                            </span>
                          )
                        ) : (
                          <span className="ml-1 text-gray-400 dark:text-gray-500">
                            • Former
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div>{formatNumber(stats.totalAttacks)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatNumber(stats.successfulAttacks)} successful
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div className="flex items-center">
                    <div className="mr-2 h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-orange-600 dark:bg-orange-400"
                        style={{
                          width: `${Math.min(stats.successRate, 100)}%`
                        }}
                      />
                    </div>
                    <span>{formatNumber(stats.successRate, 1)}%</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatNumber(stats.totalRespect, 2)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {formatNumber(stats.averageRespectPerAttack, 2)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div>{formatNumber(stats.warRespect, 2)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatNumber(stats.warAttacks)} attacks
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div>{formatNumber(stats.chainRespect, 2)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatNumber(stats.chainAttacks)} attacks
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div>{formatNumber(stats.bonusHits)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stats.totalAttacks > 0 ? ((stats.bonusHits / stats.totalAttacks) * 100).toFixed(1) : 0}% of attacks
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <div>
                    {formatNumber(stats.bestSingleHit, 2)}
                    {stats.bestBonusHit > 0 && (
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                        ({formatNumber(stats.bestBonusHit)})
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {formatNumber(stats.fairFightEfficiency, 2)}x
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
