import React, { useMemo, useEffect } from 'react'
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
  selectedMembers?: number[]
}

const COLORS = [
  '#EA580C',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899'
]

const COMPARISON_COLORS = [
  '#EA580C',
  '#3B82F6',
  '#22C55E',
  '#8B5CF6',
  '#F97316',
  '#EC4899',
  '#14B8A6',
  '#6366F1',
  '#F59E0B',
  '#0EA5E9'
]

// Custom tooltip component with dark mode support
const CustomTooltip = ({ active, payload, label, formatter, labelFormatter }: any) => {
  if (active && payload && payload.length) {
    const displayLabel = labelFormatter ? labelFormatter(label) : label;
    
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-lg">
        {displayLabel && (
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {displayLabel}
          </p>
        )}
        {payload.map((entry: any, index: number) => {
          const [formattedValue, formattedName] = formatter 
            ? formatter(entry.value, entry.name) 
            : [entry.value, entry.name || entry.dataKey];
          
          return (
            <p key={index} className="text-sm text-gray-700 dark:text-gray-300">
              <span 
                className="inline-block w-3 h-3 rounded mr-2" 
                style={{ backgroundColor: entry.color }}
              />
              {formattedName ? `${formattedName}: ${formattedValue}` : formattedValue}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function Charts({ memberStats, attacks, selectedMembers }: ChartsProps) {
  // Add custom CSS to override Recharts hover styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .recharts-bar-rectangle {
        filter: none !important;
      }
      .recharts-bar-rectangle:hover {
        filter: brightness(1.15) !important;
        opacity: 1 !important;
      }
      .recharts-active-bar {
        filter: brightness(1.15) !important;
        opacity: 1 !important;
      }
      .recharts-bar-rectangle[fill]:hover {
        filter: brightness(1.15) !important;
      }
      .recharts-bar {
        filter: none !important;
      }
      .recharts-bar:hover {
        filter: brightness(1.15) !important;
      }
      .recharts-tooltip-wrapper {
        z-index: 1000 !important;
      }
      /* Remove any white/gray overlays */
      .recharts-rectangle.recharts-bar-rectangle {
        stroke: none !important;
        stroke-width: 0 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
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

  const headToHeadTimeline = useMemo(() => {
    if (!selectedMembers || selectedMembers.length < 2) return null

    const members = selectedMembers
      .map((memberId) =>
        memberStats.find((member) => member.memberId === memberId)
      )
      .filter((member): member is MemberStats => Boolean(member))

    if (members.length < 2) return null

    const memberIdSet = new Set(members.map((member) => member.memberId))
    const relevantAttacks = attacks
      .filter(
        (attack) => attack.attacker && memberIdSet.has(attack.attacker.id)
      )
      .sort((a, b) => a.started - b.started)

    if (relevantAttacks.length === 0) return null

    const hourlyMap = new Map<number, Record<string, number>>()

    relevantAttacks.forEach((attack) => {
      if (!attack.attacker) return
      const bucketDate = new Date(attack.started * 1000)
      bucketDate.setMinutes(0, 0, 0)
      const bucketKey = bucketDate.getTime()
      const hourEntry = hourlyMap.get(bucketKey) ?? {}
      const attackerKey = attack.attacker.id.toString()
      hourEntry[attackerKey] = (hourEntry[attackerKey] ?? 0) + attack.respect_gain
      hourlyMap.set(bucketKey, hourEntry)
    })

    const sortedBuckets = Array.from(hourlyMap.keys()).sort((a, b) => a - b)
    if (sortedBuckets.length === 0) return null

    const memberMeta = members.map((member, index) => {
      const color = COMPARISON_COLORS[index % COMPARISON_COLORS.length]
      return {
        memberId: member.memberId,
        idKey: member.memberId.toString(),
        dataKey: `member_${member.memberId}`,
        name: member.name,
        color
      }
    })

    const runningTotals: Record<string, number> = {}
    memberMeta.forEach((meta) => {
      runningTotals[meta.idKey] = 0
    })

    const data = sortedBuckets.map((bucketKey) => {
      const hourEntry = hourlyMap.get(bucketKey) ?? {}
      memberMeta.forEach((meta) => {
        runningTotals[meta.idKey] =
          (runningTotals[meta.idKey] ?? 0) + (hourEntry[meta.idKey] ?? 0)
      })

      const memberValues = memberMeta.reduce(
        (acc, meta) => {
          acc[meta.dataKey] = runningTotals[meta.idKey]
          return acc
        },
        {} as Record<string, number>
      )

      const bucketDate = new Date(bucketKey)

      return {
        date: bucketDate.toISOString(),
        formattedDate: format(bucketDate, 'MMM dd'),
        ...memberValues
      }
    })

    return { data, memberMeta }
  }, [memberStats, attacks, selectedMembers])

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
              content={<CustomTooltip 
                formatter={(value: any, name: string) => [
                  typeof value === 'number' ? value.toLocaleString() : value,
                  name === 'respect'
                    ? 'Total Respect'
                    : name === 'attacks'
                      ? 'Total Attacks'
                      : 'Success Rate (%)'
                ]}
              />}
            />
            <Bar 
              dataKey="respect" 
              fill="#EA580C"
              style={{ 
                filter: 'drop-shadow(0 0 0 transparent)',
                transition: 'all 0.2s ease'
              }}
            />
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
              fill="#EA580C"
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
              content={<CustomTooltip 
                formatter={(value: any) => [value.toLocaleString(), 'Attacks']}
              />}
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
              content={<CustomTooltip 
                formatter={(value: any) => [
                  value.toLocaleString(),
                  'Cumulative Respect'
                ]}
                labelFormatter={(label: string) => `Date: ${label}`}
              />}
            />
            <Line
              type="monotone"
              dataKey="respect"
              stroke="#EA580C"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {headToHeadTimeline && headToHeadTimeline.data.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            Head-to-Head Respect
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={headToHeadTimeline.data}>
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
                content={
                  <CustomTooltip
                    formatter={(value: any, name: string) => [
                      typeof value === 'number' ? value.toLocaleString() : value,
                      name
                    ]}
                    labelFormatter={(label: string) => `Date: ${label}`}
                  />
                }
              />
              {headToHeadTimeline.memberMeta.map((meta) => (
                <Line
                  key={meta.memberId}
                  type="monotone"
                  dataKey={meta.dataKey}
                  name={meta.name}
                  stroke={meta.color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center space-x-6 text-sm">
            {headToHeadTimeline.memberMeta.map((meta) => (
              <div key={meta.memberId} className="flex items-center">
                <div
                  className="mr-2 size-3 rounded"
                  style={{ backgroundColor: meta.color }}
                ></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {meta.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <Tooltip
              content={<CustomTooltip 
                formatter={(value: any) => [value.toLocaleString(), '']}
              />}
            />
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
              fill="#EA580C"
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
            <div className="mr-2 size-3 rounded bg-orange-500"></div>
            <span>Regular</span>
          </div>
        </div>
      </div>
      */}
    </div>
  )
}
