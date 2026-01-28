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
  const x = y.map((_, i) => i)
  const n = y.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0)
  const sumX2 = x.reduce((s, xi) => s + xi * xi, 0)

  const slope =
    (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1)
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

/* ---------------- Component ---------------- */
function LineChart({ transactions }) {
  const { formatAmount } = useCurrency()
  const chartRef = useRef(null)

  const [range, setRange] = useState('all')

  /* ---------- Aggregate Monthly Data ---------- */
  const monthly = useMemo(() => {
    return transactions.reduce((acc, t) => {
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
  }, [transactions])

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
        },
      },
      tooltip: {
        backgroundColor: '#020617',
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y
            const prev = ctx.dataset.data[ctx.dataIndex - 1]
            if (typeof prev === 'number') {
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
      <div className=" bg-neutral-800 text-neutral-200 flex gap-3 text-sm">
        <button onClick={exportPNG}>Export PNG</button>
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      <Line ref={chartRef} data={data} options={options} />
    </div>
  )
}

export default LineChart
