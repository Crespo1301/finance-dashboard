import { useMemo, useRef, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { useCurrency } from '../context/CurrencyContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

/* ---------------- Utility Math ---------------- */
const linearRegression = (y) => {
  if (y.length === 0) return { slope: 0, intercept: 0 }
  
  const x = y.map((_, i) => i)
  const n = y.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0)
  const sumX2 = x.reduce((s, xi) => s + xi * xi, 0)

  const denominator = n * sumX2 - sumX * sumX
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

const stdDev = (arr) => {
  if (arr.length === 0) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  const variance =
    arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length
  return Math.sqrt(variance)
}

/**
 * Checks if a date falls within a range (inclusive).
 * @param {Date} date
 * @param {{ start: Date, end: Date } | null | undefined} range
 * @returns {boolean}
 */
const isInRange = (date, range) => {
  if (!range?.start || !range?.end) return true
  return date >= range.start && date <= range.end
}

/* ---------------- Component ---------------- */
function LineChart({ transactions, focusedCategory, currentPeriod }) {
  const { formatAmount } = useCurrency()
  const chartRef = useRef(null)

  const [range, setRange] = useState('all')

  /* ---------- Filter by Period ---------- */
  const filteredTransactions = useMemo(() => {
    if (!currentPeriod) return transactions
    return transactions.filter((t) => isInRange(new Date(t.date), currentPeriod))
  }, [transactions, currentPeriod])

  /* ---------- Aggregate Monthly Data ---------- */
  const monthly = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`

      if (!acc[key]) acc[key] = { income: 0, expenses: 0 }

      t.type === 'income'
        ? (acc[key].income += t.amount)
        : (acc[key].expenses += t.amount)

      return acc
    }, {})
  }, [filteredTransactions])

  const months = Object.keys(monthly).sort()
  const visibleMonths =
    range === 'all' ? months : months.slice(-range)

  const labels = visibleMonths.map((m) => {
    const [y, mo] = m.split('-')
    return new Date(y, mo - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    })
  })

  const income = visibleMonths.map((m) => monthly[m].income)
  const expenses = visibleMonths.map((m) => monthly[m].expenses)
  const net = income.map((v, i) => v - expenses[i])

  /* ---------- Forecast (Linear Regression) ---------- */
  const forecastSteps = 3
  const { slope, intercept } = linearRegression(net)
  const sigma = stdDev(net)

  const forecast = Array.from({ length: forecastSteps }, (_, i) =>
    slope * (net.length + i) + intercept
  )

  const upper = forecast.map((v) => v + sigma)
  const lower = forecast.map((v) => v - sigma)

  /* ---------- KPIs ---------- */
  const totalIncome = income.reduce((a, b) => a + b, 0)
  const totalExpenses = expenses.reduce((a, b) => a + b, 0)
  const netTrend =
    net.length > 1 ? net[net.length - 1] - net[0] : 0

  /* ---------- Export ---------- */
  const exportPNG = () => {
    if (!chartRef.current) return
    const link = document.createElement('a')
    link.download = 'financial-trends.png'
    link.href = chartRef.current.toBase64Image()
    link.click()
  }

  const exportCSV = () => {
    const rows = [
      ['Month', 'Income', 'Expenses', 'Net'],
      ...visibleMonths.map((m, i) => [
        m,
        income[i],
        expenses[i],
        net[i],
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'financial-data.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ---------- Empty State ---------- */
  if (visibleMonths.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-neutral-800 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-neutral-200 mb-2">No Data for Selected Period</h2>
        <p className="text-neutral-400 text-sm text-center">Add transactions or adjust the comparison period</p>
      </div>
    )
  }

  /* ---------- Chart Data ---------- */
  const data = {
    labels: [...labels, 'F1', 'F2', 'F3'],
    datasets: [
      {
        label: 'Income',
        data: income,
        borderColor: '#38bdf8', // sky-400
        backgroundColor: 'rgba(56,189,248,0.15)',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: 'Expenses',
        data: expenses,
        borderColor: '#f472b6', // pink-400
        backgroundColor: 'rgba(244,114,182,0.15)',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: 'Net',
        data: net,
        borderColor: '#22c55e', // green-500
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: 'Forecast',
        data: [...Array(net.length).fill(null), ...forecast],
        borderColor: '#22c55e',
        borderDash: [6, 6],
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: 'Confidence Band',
        data: [...Array(net.length).fill(null), ...upper],
        borderColor: 'transparent',
        backgroundColor: 'rgba(34,197,94,0.18)',
        fill: '+1',
      },
      {
        data: [...Array(net.length).fill(null), ...lower],
        borderColor: 'transparent',
        fill: false,
      },
    ],
  }

  /* ---------- Options ---------- */
  const options = {
    responsive: true,
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e5e7eb',
          usePointStyle: true,
          filter: (item) => item.text !== 'Confidence Band' && item.datasetIndex !== 5,
        },
      },
      tooltip: {
        backgroundColor: '#020617',
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y
            if (v === null) return null
            const prev = ctx.dataset.data[ctx.dataIndex - 1]
            if (typeof prev === 'number' && prev !== 0) {
              const delta = v - prev
              const pct = ((delta / Math.abs(prev)) * 100).toFixed(1)
              return `${ctx.dataset.label}: ${formatAmount(
                v
              )} (${delta >= 0 ? '+' : ''}${formatAmount(
                delta
              )}, ${pct}%)`
            }
            return `${ctx.dataset.label}: ${formatAmount(v)}`
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: '#d1d5db',
          callback: (v) => formatAmount(v),
        },
        grid: { color: 'rgba(255,255,255,0.08)' },
      },
      x: {
        ticks: { color: '#d1d5db' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  }

  return (
    <div className="p-6 rounded-2xl bg-neutral-800 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-neutral-900 p-3 rounded-lg text-sky-400">
          Income<br />
          <strong>{formatAmount(totalIncome)}</strong>
        </div>
        <div className="bg-neutral-900 p-3 rounded-lg text-pink-400">
          Expenses<br />
          <strong>{formatAmount(totalExpenses)}</strong>
        </div>
        <div className="bg-neutral-900 text-neutral-200 p-3 rounded-lg">
          Trend<br />
          <strong className={netTrend >= 0 ? 'text-green-400' : 'text-red-400'}>
            {netTrend >= 0 ? '↑ Improving' : '↓ Declining'}
          </strong>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-neutral-800 text-neutral-200 flex gap-3 text-sm">
        <button 
          onClick={exportPNG}
          className="hover:text-white transition-colors"
        >
          Export PNG
        </button>
        <button 
          onClick={exportCSV}
          className="hover:text-white transition-colors"
        >
          Export CSV
        </button>
      </div>

      <Line ref={chartRef} data={data} options={options} />
    </div>
  )
}

export default LineChart