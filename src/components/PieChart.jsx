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

/* ---------------- Color Palette (Dark UI Safe) ---------------- */
const COLORS = [
  '#38bdf8', // sky-400
  '#22c55e', // green-500
  '#f472b6', // pink-400
  '#facc15', // yellow-400
  '#a78bfa', // violet-400
  '#fb7185', // rose-400
  '#34d399', // emerald-400
  '#60a5fa', // blue-400
]

const OTHER_THRESHOLD = 0.05 // 5%

/**
 * Props:
 * - transactions: Transaction[]
 * - cutout?: number | string (default: '65%')
 */
function PieChart({ transactions, cutout = '65%' }) {
  const { formatAmount } = useCurrency()
  const [activeCategory, setActiveCategory] = useState(null)
  const [hiddenCategories, setHiddenCategories] = useState({})

  /* ---------- Filter Expenses ---------- */
  const expenses = transactions.filter((t) => t.type === 'expense')

  /* ---------- Aggregate ---------- */
  const rawTotals = useMemo(() => {
    return expenses.reduce((acc, t) => {
      const category = t.category || 'Other'
      acc[category] = (acc[category] || 0) + t.amount
      return acc
    }, {})
  }, [expenses])

  const totalExpenses = Object.values(rawTotals).reduce(
    (a, b) => a + b,
    0
  )

  /* ---------- Group Small Categories ---------- */
  const groupedTotals = {}
  let otherTotal = 0

  Object.entries(rawTotals).forEach(([key, value]) => {
    if (value / totalExpenses < OTHER_THRESHOLD) {
      otherTotal += value
    } else {
      groupedTotals[key] = value
    }
  })

  if (otherTotal > 0) {
    groupedTotals.Other = otherTotal
  }

  const sortedEntries = Object.entries(groupedTotals).sort(
    (a, b) => b[1] - a[1]
  )

  const labels = sortedEntries.map(([label]) => label)
  const values = sortedEntries.map(([, value]) => value)

  /* ---------- Visual State ---------- */
  const displayValues = labels.map((label, i) => {
    if (hiddenCategories[label]) return 0
    if (activeCategory && activeCategory !== label) return values[i] * 0.15
    return values[i]
  })

  const backgroundColors = labels.map((_, i) =>
    activeCategory && activeCategory !== labels[i]
      ? 'rgba(255,255,255,0.08)'
      : COLORS[i % COLORS.length]
  )

  /* ---------- Data ---------- */
  const data = {
    labels,
    datasets: [
      {
        data: displayValues,
        backgroundColor: backgroundColors,
        borderColor: '#0f172a',
        borderWidth: 2,
        hoverOffset: 14,
        cutout,
      },
    ],
  }

  /* ---------- Options ---------- */
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 700,
      easing: 'easeOutQuart',
    },
    onClick: (_, elements) => {
      if (!elements.length) {
        setActiveCategory(null)
        return
      }
      const index = elements[0].index
      const clickedLabel = labels[index]
      setActiveCategory((prev) =>
        prev === clickedLabel ? null : clickedLabel
      )
    },
    plugins: {
      legend: {
        position: 'bottom',
        onClick: (_, legendItem) => {
          const label = legendItem.text
          setHiddenCategories((prev) => ({
            ...prev,
            [label]: !prev[label],
          }))
        },
        labels: {
          color: '#e5e7eb',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#020617',
        padding: 12,
        callbacks: {
          label: (context) => {
            const value = values[context.dataIndex]
            const percentage =
              totalExpenses > 0
                ? ((value / totalExpenses) * 100).toFixed(1)
                : 0
            return `${context.label}: ${formatAmount(
              value
            )} (${percentage}%)`
          },
        },
      },
    },
  }

  /* ---------- Empty State ---------- */
  if (!expenses.length) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-neutral-800 flex items-center justify-center min-h-[360px]">
        <p className="text-neutral-400">
          Add expenses to see category distribution
        </p>
      </div>
    )
  }

  /* ---------- Center Label ---------- */
  const centerValue = activeCategory
    ? groupedTotals[activeCategory]
    : totalExpenses

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-neutral-800 space-y-6">
      <h2 className="text-xl font-semibold text-neutral-200 tracking-tight">
        Expense Breakdown
      </h2>

      <div className="relative flex justify-center">
        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-sm text-neutral-400">
            {activeCategory || 'Total'}
          </span>
          <span className="text-lg font-semibold text-neutral-200">
            {formatAmount(centerValue)}
          </span>
        </div>

        <div className="w-full max-w-[340px]">
          <Pie data={data} options={options} />
        </div>
      </div>

      {/* Interaction Hint */}
      <div className="text-xs text-neutral-500">
        Click a slice to focus · Click legend to toggle · Click empty space to reset
      </div>
    </div>
  )
}

export default PieChart
