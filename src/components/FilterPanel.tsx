import React, { useState, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { TimeFilter, MemberFilter, AttackFilter, saveTimeFilter } from '../types/filters'
import { AttackType, AttackResult } from '../types/api'

export default function FilterPanel() {
  const { state, updateFilters } = useApp()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleTimeFilterChange = (timeFilter: Partial<TimeFilter>) => {
    const newTimeFilter = { ...state.filters.time, ...timeFilter }
    updateFilters({
      ...state.filters,
      time: newTimeFilter
    })
    // Save to localStorage
    saveTimeFilter(newTimeFilter)
  }

  const handleMemberFilterChange = (memberFilter: Partial<MemberFilter>) => {
    updateFilters({
      ...state.filters,
      members: { ...state.filters.members, ...memberFilter }
    })
  }

  const handleAttackFilterChange = (attackFilter: Partial<AttackFilter>) => {
    updateFilters({
      ...state.filters,
      attacks: { ...state.filters.attacks, ...attackFilter }
    })
  }

  const presetButtons = [
    { key: '1h', label: '1 Hour' },
    { key: '6h', label: '6 Hours' },
    { key: '24h', label: '24 Hours' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' }
  ] as const

  const attackTypes: { key: AttackType; label: string }[] = [
    { key: 'regular', label: 'Regular' },
    { key: 'war', label: 'War' },
    { key: 'chain', label: 'Chain' },
    { key: 'bonus', label: 'Bonus' },
    { key: 'retaliation', label: 'Retaliation' },
    { key: 'overseas', label: 'Overseas' }
  ]

  const attackResults: { key: AttackResult; label: string }[] = [
    { key: 'Attacked', label: 'Attacked' },
    { key: 'Mugged', label: 'Mugged' },
    { key: 'Hospitalized', label: 'Hospitalized' },
    { key: 'Lost', label: 'Lost' },
    { key: 'Assist', label: 'Assist' },
    { key: 'Stalemate', label: 'Stalemate' }
  ]

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 py-4">
          {/* Filters title with inline time range buttons */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Filters</h2>
              
              {/* Time Range Buttons - Inline */}
              <div className="flex items-center space-x-2">
                {presetButtons.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() =>
                      handleTimeFilterChange({ preset: preset.key })
                    }
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      state.filters.time.preset === preset.key
                        ? preset.key === 'all'
                          ? 'bg-orange-600 dark:bg-orange-500 text-white'
                          : 'bg-blue-600 dark:bg-blue-500 text-white'
                        : preset.key === 'all'
                          ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800/50'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {isExpanded ? 'Hide More Filters' : 'More Filters'}
              <svg
                className={`ml-2 size-4 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Time Range Conditional Content */}
          <div>
            {state.filters.time.preset === 'all' && (
              <div className="rounded-md bg-orange-50 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800 p-3">
                <div className="flex">
                  <svg className="h-5 w-5 text-orange-400 dark:text-orange-300 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      All Time Data Warning
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      This will fetch all faction attack data, which may take several minutes for established factions. 
                      The operation will show progress as it loads batches of attacks.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {state.filters.time.preset === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    From
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      state.filters.time.from?.toISOString().slice(0, 16) ||
                      ''
                    }
                    onChange={(e) =>
                      handleTimeFilterChange({
                        from: e.target.value
                          ? new Date(e.target.value)
                          : undefined
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    To
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      state.filters.time.to?.toISOString().slice(0, 16) ||
                      ''
                    }
                    onChange={(e) =>
                      handleTimeFilterChange({
                        to: e.target.value
                          ? new Date(e.target.value)
                          : undefined
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* Member Filter */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Members
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={state.filters.members.searchQuery}
                    onChange={(e) =>
                      handleMemberFilterChange({ searchQuery: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {state.factionData && (
                    <MemberMultiSelect
                      members={state.factionData.memberStats}
                      selectedMembers={state.filters.members.selectedMembers}
                      searchQuery={state.filters.members.searchQuery}
                      onSelectionChange={(selectedMembers) =>
                        handleMemberFilterChange({ selectedMembers })
                      }
                    />
                  )}

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={state.filters.members.currentMembersOnly}
                        onChange={(e) =>
                          handleMemberFilterChange({
                            currentMembersOnly: e.target.checked,
                            formerMembersOnly: e.target.checked
                              ? false
                              : state.filters.members.formerMembersOnly
                          })
                        }
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Current members only
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={state.filters.members.formerMembersOnly}
                        onChange={(e) =>
                          handleMemberFilterChange({
                            formerMembersOnly: e.target.checked,
                            currentMembersOnly: e.target.checked
                              ? false
                              : state.filters.members.currentMembersOnly
                          })
                        }
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Former members only
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Attack Filter */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Attack Types
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                      Types
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {attackTypes.map((type) => (
                        <label key={type.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={state.filters.attacks.attackTypes.includes(
                              type.key
                            )}
                            onChange={(e) => {
                              const newTypes = e.target.checked
                                ? [
                                    ...state.filters.attacks.attackTypes,
                                    type.key
                                  ]
                                : state.filters.attacks.attackTypes.filter(
                                    (t) => t !== type.key
                                  )
                              handleAttackFilterChange({
                                attackTypes: newTypes
                              })
                            }}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                          />
                          <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">
                            {type.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                      Results
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {attackResults.map((result) => (
                        <label key={result.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={state.filters.attacks.results.includes(
                              result.key
                            )}
                            onChange={(e) => {
                              const newResults = e.target.checked
                                ? [...state.filters.attacks.results, result.key]
                                : state.filters.attacks.results.filter(
                                    (r) => r !== result.key
                                  )
                              handleAttackFilterChange({ results: newResults })
                            }}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                          />
                          <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">
                            {result.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                      Special Filters
                    </h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={state.filters.attacks.includeBonusHits}
                        onChange={(e) =>
                          handleAttackFilterChange({
                            includeBonusHits: e.target.checked
                          })
                        }
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                      />
                      <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                        Include Bonus Hits
                      </span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Chain bonus hits at 10, 20, 40, 80, 160, 320... respect
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Multi-select component for member selection
interface MemberMultiSelectProps {
  members: Array<{ memberId: number; name: string; isCurrentMember: boolean }>
  selectedMembers: number[]
  searchQuery: string
  onSelectionChange: (selectedMembers: number[]) => void
}

function MemberMultiSelect({
  members,
  selectedMembers,
  searchQuery,
  onSelectionChange
}: MemberMultiSelectProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const filteredMembers = useMemo(() => {
    return members
      .filter(member => {
        if (searchQuery) {
          return member.name.toLowerCase().includes(searchQuery.toLowerCase())
        }
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [members, searchQuery])

  const handleMemberToggle = (memberId: number) => {
    if (selectedMembers.includes(memberId)) {
      onSelectionChange(selectedMembers.filter(id => id !== memberId))
    } else {
      onSelectionChange([...selectedMembers, memberId])
    }
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  const selectedMemberNames = members
    .filter(m => selectedMembers.includes(m.memberId))
    .map(m => m.name)
    .sort()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Compare Members ({selectedMembers.length} selected)
        </label>
        {selectedMembers.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Clear All
          </button>
        )}
      </div>

      {selectedMembers.length > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">Selected:</span>{' '}
          {selectedMemberNames.slice(0, 3).join(', ')}
          {selectedMemberNames.length > 3 && ` +${selectedMemberNames.length - 3} more`}
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {selectedMembers.length === 0 
            ? 'Select members to compare...' 
            : `${selectedMembers.length} member${selectedMembers.length === 1 ? '' : 's'} selected`
          }
          <svg
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isExpanded && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No members match your search.' : 'No members available.'}
              </div>
            ) : (
              filteredMembers.map((member) => (
                <label
                  key={member.memberId}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.memberId)}
                    onChange={() => handleMemberToggle(member.memberId)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 mr-2"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {member.name}
                    {!member.isCurrentMember && (
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(Former)</span>
                    )}
                  </span>
                </label>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
