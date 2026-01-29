import { useMemo, useState } from 'react'
import { Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { useCurrency } from '../context/CurrencyContext'

ChartJS.register(ArcElement, Tooltip, Legend)

/* ---------------- Constants ---------------- */
const COLORS = [
  '#38bdf8',
  '#22c55e',
  '#f472b6',
  '#facc15',
  '#a78bfa',
  '#fb7185',
  '#34d399',
  '#60a5fa',
]

const OTHER_THRESHOLD = 0.05

/**
 * Checks if a date falls within a range (inclusive).
 * Handles null/undefined ranges by returning true (no filter applied).
 * @param {Date} date - The date to check
 * @param {{ start: Date, end: Date } | null | undefined} range - The range to check against
 * @returns {boolean}
 */
const isInRange = (date, range) => {
  if (!range?.start || !range?.end) return true
  return date >= range.start && date <= range.end
}

function PieChart({
  transactions = [],
  currentPeriod,
  previousPeriod,
  cutout = '65%',
  onCategoryFocus,
}) {
  const { formatAmount } = useCurrency()
  const [activeCategory, setActiveCategory] = useState(null)
  const [hidden, setHidden] = useState({})

  /* ---------- Helpers ---------- */
  const aggregate = (txs) =>
    txs.reduce((acc, t) => {
      const cat = t.category || 'Other'
      acc[cat] = (acc[cat] || 0) + t.amount
      return acc
    }, {})

  /* ---------- Expense Sets ---------- */
  const allExpenses = useMemo(
    () => transactions.filter((t) => t.type === 'expense'),
    [transactions]
  )

  const periodExpenses = useMemo(() => {
    if (!currentPeriod) return allExpenses
    return allExpenses.filter((t) =>
      isInRange(new Date(t.date), currentPeriod)
    )
  }, [allExpenses, currentPeriod])

  const previousExpenses = useMemo(() => {
    if (!previousPeriod) return []
    return allExpenses.filter((t) =>
      isInRange(new Date(t.date), previousPeriod)
    )
  }, [allExpenses, previousPeriod])

  /* ---------- Fallback + Comparison Guard ---------- */
  const hasCurrentPeriodData = periodExpenses.length > 0
  const hasPreviousPeriodData = previousExpenses.length > 0

  const comparisonActive =
    hasCurrentPeriodData && hasPreviousPeriodData

  const currentExpenses = hasCurrentPeriodData
    ? periodExpenses
    : allExpenses

  if (!currentExpenses.length) {
    return (
      <div className="p-8 rounded-2xl bg-neutral-800 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-neutral-200 mb-2">No Expense Data</h2>
        <p className="text-neutral-400 text-sm text-center">Add expense transactions to see the breakdown</p>
      </div>
    )
  }

  /* ---------- Aggregation ---------- */
  const currentTotals = aggregate(currentExpenses)
  const previousTotals = aggregate(previousExpenses)

  const totalCurrent = Object.values(currentTotals).reduce(
    (a, b) => a + b,
    0
  )

  /* ---------- Group Small Categories ---------- */
  const grouped = {}
  let other = 0

  Object.entries(currentTotals).forEach(([cat, value]) => {
    if (value / totalCurrent < OTHER_THRESHOLD) {
      other += value
    } else {
      grouped[cat] = value
    }
  })

  if (other > 0) grouped.Other = other

  const entries = Object.entries(grouped).sort(
    (a, b) => b[1] - a[1]
  )

  const labels = entries.map(([l]) => l)
  const values = entries.map(([, v]) => v)

  /* ---------- Deltas (ONLY if comparison valid) ---------- */
  const deltas = comparisonActive
    ? labels.reduce((acc, label) => {
        const prev = previousTotals[label] || 0
        const curr = currentTotals[label] || 0
        acc[label] =
          prev === 0 ? null : ((curr - prev) / prev) * 100
        return acc
      }, {})
    : {}

  /* ---------- Visual State ---------- */
  const displayValues = labels.map((label, i) => {
    if (hidden[label]) return 0
    if (activeCategory && activeCategory !== label)
      return values[i] * 0.15
    return values[i]
  })

  const backgroundColors = labels.map((label, i) =>
    activeCategory && activeCategory !== label
      ? 'rgba(255,255,255,0.08)'
      : COLORS[i % COLORS.length]
  )

  const borderColors = labels.map((label) => {
    if (!comparisonActive) return '#0f172a'
    const delta = deltas[label]
    if (delta == null) return '#0f172a'
    return delta >= 0 ? '#22c55e' : '#ef4444'
  })

  /* ---------- Chart ---------- */
  const data = {
    labels,
    datasets: [
      {
        data: displayValues,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverOffset: 16,
        cutout,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    animation: { duration: 700, easing: 'easeOutQuart' },
    onClick: (_, elements) => {
      if (!elements.length) {
        setActiveCategory(null)
        onCategoryFocus?.(null)
        return
      }
      const label = labels[elements[0].index]
      const next = activeCategory === label ? null : label
      setActiveCategory(next)
      onCategoryFocus?.(next)
    },
    plugins: {
      legend: {
        position: 'bottom',
        onClick: (_, item) => {
          const label = item.text
          setHidden((p) => ({ ...p, [label]: !p[label] }))
        },
        labels: {
          color: '#e5e7eb',
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#020617',
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const label = ctx.label
            const value = values[ctx.dataIndex]
            const delta = deltas[label]

            return comparisonActive && delta != null
              ? `${label}: ${formatAmount(
                  value
                )} (${delta >= 0 ? '▲' : '▼'} ${Math.abs(
                  delta
                ).toFixed(1)}%)`
              : `${label}: ${formatAmount(value)}`
          },
        },
      },
    },
  }

  const centerValue = activeCategory
    ? grouped[activeCategory]
    : totalCurrent

  const centerDelta =
    comparisonActive &&
    activeCategory &&
    deltas[activeCategory] != null
      ? deltas[activeCategory]
      : null

  /* ---------- Status Message ---------- */
  const getStatusMessage = () => {
    if (comparisonActive) {
      return 'Comparing selected periods'
    }
    if (hasCurrentPeriodData) {
      return hasPreviousPeriodData 
        ? 'Comparison active' 
        : 'No previous period data for comparison'
    }
    return 'Showing all-time expenses (no data for selected period)'
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-neutral-800 space-y-6">
      <h2 className="text-xl font-semibold text-neutral-200">
        Expense Breakdown
      </h2>

      <div className="relative flex justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-sm text-neutral-400">
            {activeCategory || 'Total'}
          </span>
          <span className="text-lg font-semibold text-neutral-200">
            {formatAmount(centerValue)}
          </span>

          {centerDelta != null && (
            <span
              className={`text-xs mt-1 ${
                centerDelta >= 0
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              {centerDelta >= 0 ? '▲' : '▼'}{' '}
              {Math.abs(centerDelta).toFixed(1)}%
            </span>
          )}
        </div>

        <div className="w-full max-w-[360px]">
          <Pie data={data} options={options} />
        </div>
      </div>

      <div className="text-xs text-neutral-500">
        {getStatusMessage()}
      </div>
    </div>
  )
}

export default PieChart