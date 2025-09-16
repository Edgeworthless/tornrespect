import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { MemberStats, ProcessedAttack } from '../types/api'
import { format } from 'date-fns'

interface ChartsProps {
  memberStats: MemberStats[]
  attacks: ProcessedAttack[]
}

const COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899'
]

export default function Charts({ memberStats, attacks }: ChartsProps) {
  const topPerformersData = useMemo(() => {
    return memberStats.slice(0, 10).map((stats) => ({
      name:
        stats.name.length > 15 ? `${stats.name.slice(0, 15)}...` : stats.name,
      respect: stats.totalRespect,
      attacks: stats.totalAttacks,
      successRate: stats.successRate
    }))
  }, [memberStats])

  const attackDistributionData = useMemo(() => {
    const distribution = attacks.reduce(
      (acc, attack) => {
        acc[attack.attackType] = (acc[attack.attackType] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return Object.entries(distribution).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      percentage: ((count / attacks.length) * 100).toFixed(1)
    }))
  }, [attacks])

  const respectTimelineData = useMemo(() => {
    if (attacks.length === 0) return []

    const sortedAttacks = [...attacks].sort((a, b) => a.started - b.started)
    const timelineMap = new Map<string, number>()
    let cumulativeRespect = 0

    sortedAttacks.forEach((attack) => {
      const date = format(new Date(attack.started * 1000), 'yyyy-MM-dd')
      cumulativeRespect += attack.respect_gain
      timelineMap.set(date, cumulativeRespect)
    })

    return Array.from(timelineMap.entries()).map(([date, respect]) => ({
      date,
      respect,
      formattedDate: format(new Date(date), 'MMM dd')
    }))
  }, [attacks])

  const memberComparisonData = useMemo(() => {
    return memberStats.slice(0, 8).map((stats) => ({
      name:
        stats.name.length > 12 ? `${stats.name.slice(0, 12)}...` : stats.name,
      warRespect: stats.warRespect,
      chainRespect: stats.chainRespect,
      regularRespect: stats.totalRespect - stats.warRespect - stats.chainRespect
    }))
  }, [memberStats])

  if (memberStats.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Top Performers Bar Chart */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          Top Performers - Total Respect
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topPerformersData}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-600" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
              tick={{ fill: 'currentColor' }}
              className="dark:text-white"
            />
            <YAxis
              tickFormatter={(value) => value.toLocaleString()}
              fontSize={12}
              tick={{ fill: 'currentColor' }}
              className="dark:text-white"
            />
            <Tooltip
              formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                name === 'respect'
                  ? 'Total Respect'
                  : name === 'attacks'
                    ? 'Total Attacks'
                    : 'Success Rate (%)'
              ]}
            />
            <Bar dataKey="respect" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/*       Attack Type Distribution Pie Chart
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          Attack Type Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={attackDistributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }: any) => {
                const total = attackDistributionData.reduce((sum, item) => sum + item.value, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return `${name} (${percentage}%)`
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {attackDistributionData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [value.toLocaleString(), 'Attacks']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
 */}
      {/* Respect Timeline */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          Respect Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={respectTimelineData}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-600" />
            <XAxis 
              dataKey="formattedDate" 
              fontSize={12}
              tick={{ fill: 'currentColor' }}
              className="dark:text-white"
            />
            <YAxis
              tickFormatter={(value) => value.toLocaleString()}
              fontSize={12}
              tick={{ fill: 'currentColor' }}
              className="dark:text-white"
            />
            <Tooltip
              formatter={(value) => [
                value.toLocaleString(),
                'Cumulative Respect'
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="respect"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Member Comparison - Stacked Bar 
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          Respect by Type - Top Members
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={memberComparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => value.toLocaleString()}
              fontSize={12}
            />
            <Tooltip formatter={(value) => [value.toLocaleString(), '']} />
            <Bar
              dataKey="warRespect"
              stackId="a"
              fill="#EF4444"
              name="War Respect"
            />
            <Bar
              dataKey="chainRespect"
              stackId="a"
              fill="#10B981"
              name="Chain Respect"
            />
            <Bar
              dataKey="regularRespect"
              stackId="a"
              fill="#3B82F6"
              name="Regular Respect"
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="mr-2 size-3 rounded bg-red-500"></div>
            <span>War</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 size-3 rounded bg-green-500"></div>
            <span>Chain</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 size-3 rounded bg-blue-500"></div>
            <span>Regular</span>
          </div>
        </div>
      </div>
      */}
    </div>
  )
}
