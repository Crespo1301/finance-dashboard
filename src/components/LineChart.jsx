import { useMemo, useRef } from 'react'
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
  const denom = n * sumX2 - sumX * sumX
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

const stdDev = (arr) => {
  if (arr.length === 0) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(
    arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length
  )
}

const isInRange = (date, range) => {
  if (!range?.start || !range?.end) return true
  return date >= range.start && date <= range.end
}

/* ---------------- Component ---------------- */
function LineChart({ transactions, focusedCategory, currentPeriod }) {
  const { formatAmount } = useCurrency()
  const chartRef = useRef(null)

  /* ---------- Filter by Period ---------- */
  const filteredTransactions = useMemo(() => {
    if (!currentPeriod) return transactions
    return transactions.filter((t) =>
      isInRange(new Date(t.date), currentPeriod)
    )
  }, [transactions, currentPeriod])

  /* ---------- Monthly Aggregation ---------- */
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
  if (months.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-neutral-800 flex items-center justify-center min-h-[300px] text-neutral-400">
        No data for selected period
      </div>
    )
  }

  const labels = months.map((m) => {
    const [y, mo] = m.split('-')
    return new Date(y, mo - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    })
  })

  const income = months.map((m) => monthly[m].income)
  const expenses = months.map((m) => monthly[m].expenses)
  const net = income.map((v, i) => v - expenses[i])

  /* ---------- Forecast ---------- */
  const forecastSteps = 3
  const { slope, intercept } = linearRegression(net)
  const sigma = stdDev(net)

  const forecast = Array.from({ length: forecastSteps }, (_, i) =>
    slope * (net.length + i) + intercept
  )
  const upper = forecast.map((v) => v + sigma)
  const lower = forecast.map((v) => v - sigma)

  /* ---------- Hover Sync Visuals ---------- */
  const dimmed = focusedCategory != null

  /* ---------- Chart Data ---------- */
  const data = {
    labels: [...labels, 'F1', 'F2', 'F3'],
    datasets: [
      {
        label: 'Income',
        data: income,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56,189,248,0.15)',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 3,
        opacity: dimmed ? 0.35 : 1,
      },
      {
        label: 'Expenses',
        data: expenses,
        borderColor: '#f472b6',
        backgroundColor: 'rgba(244,114,182,0.15)',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: 'Net',
        data: net,
        borderColor: '#22c55e',
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
          filter: (item) =>
            item.text !== 'Confidence Band' &&
            item.datasetIndex !== 5,
        },
      },
      tooltip: {
        backgroundColor: '#020617',
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y
            if (v == null) return null
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
      <Line ref={chartRef} data={data} options={options} />
    </div>
  )
}

export default LineChart
