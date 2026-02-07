import { useMemo, useRef, useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { useCurrency } from '../context/CurrencyContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
)

/* -------------------------------------------- */
/* Helpers */
/* -------------------------------------------- */
const safeDate = (d) => {
  const dt = d instanceof Date ? d : new Date(d)
  return Number.isNaN(dt.getTime()) ? null : dt
}

const pctChange = (curr, prev) => {
  if (prev === 0 || prev == null) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

const clamp = (n, a, b) => Math.max(a, Math.min(b, n))

const round1 = (n) => Math.round(n * 10) / 10

const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

const stddev = (arr) => {
  if (!arr.length) return 0
  const m = mean(arr)
  const v = mean(arr.map((x) => (x - m) * (x - m)))
  return Math.sqrt(v)
}

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const downloadBlob = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* -------------------------------------------- */
/* Component */
/* -------------------------------------------- */
function YearComparison({ transactions = [] }) {
  const { formatAmount } = useCurrency()

  const mainChartRef = useRef(null)
  const categoryChartRef = useRef(null)
  const monthlyChartRef = useRef(null)
  const waterfallRef = useRef(null)
  const contributionsRef = useRef(null)

  const [selectedYear, setSelectedYear] = useState(null)

  const [tab, setTab] = useState('overview') // overview | categories | monthly | anomalies | waterfall | contributions
  const [chartMode, setChartMode] = useState('grouped') // grouped | savings
  const [valueMode, setValueMode] = useState('absolute') // absolute | yoy

  const [showRollingAvg, setShowRollingAvg] = useState(true)
  const [rollingWindow, setRollingWindow] = useState(2)

  const [baselineMode, setBaselineMode] = useState('prior') // prior | custom
  const [baselineYear, setBaselineYear] = useState(null)

  const [topN, setTopN] = useState(8)

  const [showCumulativeSavings, setShowCumulativeSavings] = useState(false)
  const [anomalyZ, setAnomalyZ] = useState(2)

  /* ---------- Aggregate yearly totals ---------- */
  const yearly = useMemo(() => {
    const byYear = new Map()

    for (const t of transactions) {
      const dt = safeDate(t.date)
      if (!dt) continue
      const y = dt.getFullYear()
      if (!byYear.has(y)) byYear.set(y, { income: 0, expenses: 0 })

      const amt = Number(t.amount) || 0
      if (t.type === 'income') byYear.get(y).income += amt
      if (t.type === 'expense') byYear.get(y).expenses += amt
    }

    const years = Array.from(byYear.keys()).sort((a, b) => a - b)

    const rows = years.map((year, idx) => {
      const cur = byYear.get(year)
      const savings = cur.income - cur.expenses
      const savingsRate = cur.income > 0 ? (savings / cur.income) * 100 : null

      const priorYear = idx > 0 ? years[idx - 1] : null
      const prior = priorYear != null ? byYear.get(priorYear) : null
      const priorSavings = prior ? prior.income - prior.expenses : null

      return {
        year,
        income: cur.income,
        expenses: cur.expenses,
        savings,
        savingsRate,
        priorYear,
        incomeYoY: prior ? pctChange(cur.income, prior.income) : null,
        expensesYoY: prior ? pctChange(cur.expenses, prior.expenses) : null,
        savingsYoY: priorSavings != null ? pctChange(savings, priorSavings) : null,
      }
    })

    return { byYear, years, rows }
  }, [transactions])

  const allYears = yearly.years
  const rows = yearly.rows

  /* ---------- Year range ---------- */
  const [rangeStart, setRangeStart] = useState(() => (allYears.length ? allYears[0] : null))
  const [rangeEnd, setRangeEnd] = useState(() => (allYears.length ? allYears[allYears.length - 1] : null))

  useEffect(() => {
    if (!allYears.length) return
    setRangeStart((s) => (s == null ? allYears[0] : s))
    setRangeEnd((e) => (e == null ? allYears[allYears.length - 1] : e))
  }, [allYears])

  const yearsInRange = useMemo(() => {
    if (!allYears.length) return []
    const start = rangeStart ?? allYears[0]
    const end = rangeEnd ?? allYears[allYears.length - 1]
    const s = Math.min(start, end)
    const e = Math.max(start, end)
    return allYears.filter((y) => y >= s && y <= e)
  }, [allYears, rangeStart, rangeEnd])

  const rowsInRange = useMemo(() => {
    const set = new Set(yearsInRange)
    return rows.filter((r) => set.has(r.year))
  }, [rows, yearsInRange])

  /* ---------- Selected year ---------- */
  const effectiveSelectedYear = useMemo(() => {
    if (selectedYear != null && yearsInRange.includes(selectedYear)) return selectedYear
    return yearsInRange.length ? yearsInRange[yearsInRange.length - 1] : null
  }, [selectedYear, yearsInRange])

  const selectedRow = useMemo(() => {
    if (effectiveSelectedYear == null) return null
    return rows.find((r) => r.year === effectiveSelectedYear) || null
  }, [rows, effectiveSelectedYear])

  /* ---------- Baseline resolution ---------- */
  const resolvedBaselineYear = useMemo(() => {
    if (!effectiveSelectedYear) return null
    if (baselineMode === 'custom') {
      if (baselineYear != null && allYears.includes(baselineYear)) return baselineYear
      return selectedRow?.priorYear ?? null
    }
    return selectedRow?.priorYear ?? null
  }, [baselineMode, baselineYear, allYears, effectiveSelectedYear, selectedRow])

  const baselineRow = useMemo(() => {
    if (resolvedBaselineYear == null) return null
    return rows.find((r) => r.year === resolvedBaselineYear) || null
  }, [rows, resolvedBaselineYear])

  /* ---------- Rolling average (savings) ---------- */
  const rollingAvgSavings = useMemo(() => {
    if (!yearsInRange.length) return []
    const w = Math.max(1, Number(rollingWindow) || 2)

    const series = yearsInRange.map((y) => {
      const cur = yearly.byYear.get(y)
      if (!cur) return null
      return (cur.income || 0) - (cur.expenses || 0)
    })

    return series.map((_, idx) => {
      const from = Math.max(0, idx - (w - 1))
      const slice = series.slice(from, idx + 1).filter((v) => typeof v === 'number')
      if (!slice.length) return null
      return slice.reduce((a, b) => a + b, 0) / slice.length
    })
  }, [yearsInRange, yearly.byYear, rollingWindow])

  /* ---------- Main chart ---------- */
  const mainChartData = useMemo(() => {
    if (!yearsInRange.length) return null

    const labels = yearsInRange.map(String)
    const income = yearsInRange.map((y) => yearly.byYear.get(y)?.income || 0)
    const expenses = yearsInRange.map((y) => yearly.byYear.get(y)?.expenses || 0)
    const savings = yearsInRange.map((y) => (yearly.byYear.get(y)?.income || 0) - (yearly.byYear.get(y)?.expenses || 0))

    const rowMap = new Map(rows.map((r) => [r.year, r]))
    const incomeYoY = yearsInRange.map((y) => rowMap.get(y)?.incomeYoY ?? null)
    const expensesYoY = yearsInRange.map((y) => rowMap.get(y)?.expensesYoY ?? null)
    const savingsYoY = yearsInRange.map((y) => rowMap.get(y)?.savingsYoY ?? null)

    if (valueMode === 'yoy') {
      if (chartMode === 'savings') {
        return {
          labels,
          datasets: [
            {
              label: 'Savings YoY',
              data: savingsYoY,
              backgroundColor: 'rgba(34,197,94,0.25)',
              borderColor: '#22c55e',
              borderWidth: 1,
              borderRadius: 8,
            },
          ],
        }
      }

      return {
        labels,
        datasets: [
          {
            label: 'Income YoY',
            data: incomeYoY,
            backgroundColor: 'rgba(56,189,248,0.25)',
            borderColor: '#38bdf8',
            borderWidth: 1,
            borderRadius: 8,
          },
          {
            label: 'Expenses YoY',
            data: expensesYoY,
            backgroundColor: 'rgba(244,114,182,0.25)',
            borderColor: '#f472b6',
            borderWidth: 1,
            borderRadius: 8,
          },
          {
            label: 'Savings YoY',
            data: savingsYoY,
            backgroundColor: 'rgba(34,197,94,0.25)',
            borderColor: '#22c55e',
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      }
    }

    const base =
      chartMode === 'savings'
        ? [
            {
              label: 'Savings',
              data: savings,
              backgroundColor: 'rgba(34,197,94,0.22)',
              borderColor: '#22c55e',
              borderWidth: 1,
              borderRadius: 8,
            },
          ]
        : [
            {
              label: 'Income',
              data: income,
              backgroundColor: 'rgba(56,189,248,0.22)',
              borderColor: '#38bdf8',
              borderWidth: 1,
              borderRadius: 8,
            },
            {
              label: 'Expenses',
              data: expenses,
              backgroundColor: 'rgba(244,114,182,0.22)',
              borderColor: '#f472b6',
              borderWidth: 1,
              borderRadius: 8,
            },
            {
              label: 'Savings',
              data: savings,
              backgroundColor: 'rgba(34,197,94,0.22)',
              borderColor: '#22c55e',
              borderWidth: 1,
              borderRadius: 8,
            },
          ]

    const datasets = [...base]

    if (showRollingAvg && valueMode === 'absolute') {
      datasets.push({
        type: 'line',
        label: `${rollingWindow}-year avg savings`,
        data: rollingAvgSavings,
        borderColor: '#e5e7eb',
        backgroundColor: 'rgba(229,231,235,0.08)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 4,
        tension: 0.25,
      })
    }

    return { labels, datasets }
  }, [yearsInRange, yearly.byYear, rows, chartMode, valueMode, showRollingAvg, rollingWindow, rollingAvgSavings])

  const mainChartOptions = useMemo(() => {
    const isPct = valueMode === 'yoy'
    return {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 3,
      interaction: { mode: 'nearest', intersect: false },
      onClick: (_, elements) => {
        if (!elements?.length) return
        const idx = elements[0].index
        const y = yearsInRange[idx]
        if (y != null) setSelectedYear(y)
      },
      plugins: {
        legend: {
          position: 'bottom',
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
            title: (items) => (items?.[0]?.label ? `Year ${items[0].label}` : ''),
            label: (ctx) => {
              const v = ctx.parsed?.y
              if (v == null) return null
              if (isPct) return `${ctx.dataset.label}: ${Number(v).toFixed(1)}%`
              return `${ctx.dataset.label}: ${formatAmount(v)}`
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            color: '#d1d5db',
            callback: (v) => (isPct ? `${Number(v).toFixed(0)}%` : formatAmount(v)),
          },
          grid: { color: 'rgba(255,255,255,0.08)' },
        },
        x: {
          ticks: { color: '#d1d5db' },
          grid: { display: false },
        },
      },
    }
  }, [yearsInRange, valueMode, formatAmount])

  /* ---------- Monthly breakdown for selected year ---------- */
  const monthly = useMemo(() => {
    if (!effectiveSelectedYear) return null

    const byMonth = Array.from({ length: 12 }, () => ({ income: 0, expenses: 0 }))

    for (const t of transactions) {
      const dt = safeDate(t.date)
      if (!dt) continue
      if (dt.getFullYear() !== effectiveSelectedYear) continue

      const m = dt.getMonth()
      const amt = Number(t.amount) || 0
      if (t.type === 'income') byMonth[m].income += amt
      if (t.type === 'expense') byMonth[m].expenses += amt
    }

    const income = byMonth.map((x) => x.income)
    const expenses = byMonth.map((x) => x.expenses)
    const savings = byMonth.map((_, i) => income[i] - expenses[i])

    const cumulativeSavings = savings.reduce((acc, v) => {
      const prev = acc.length ? acc[acc.length - 1] : 0
      acc.push(prev + v)
      return acc
    }, [])

    return { income, expenses, savings, cumulativeSavings }
  }, [transactions, effectiveSelectedYear])

  const monthlyChartData = useMemo(() => {
    if (!monthly) return null

    const datasets = [
      {
        type: 'bar',
        label: 'Income',
        data: monthly.income,
        backgroundColor: 'rgba(56,189,248,0.20)',
        borderColor: '#38bdf8',
        borderWidth: 1,
        borderRadius: 8,
        stack: 'money',
      },
      {
        type: 'bar',
        label: 'Expenses',
        data: monthly.expenses,
        backgroundColor: 'rgba(244,114,182,0.20)',
        borderColor: '#f472b6',
        borderWidth: 1,
        borderRadius: 8,
        stack: 'money',
      },
      {
        type: 'line',
        label: 'Savings',
        data: monthly.savings,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.10)',
        borderWidth: 2,
        tension: 0.25,
        pointRadius: 3,
        pointHoverRadius: 4,
        yAxisID: 'y',
      },
    ]

    if (showCumulativeSavings) {
      datasets.push({
        type: 'line',
        label: 'Cumulative savings',
        data: monthly.cumulativeSavings,
        borderColor: '#e5e7eb',
        backgroundColor: 'rgba(229,231,235,0.06)',
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 2,
        pointHoverRadius: 3,
        yAxisID: 'y',
      })
    }

    return { labels: monthLabels, datasets }
  }, [monthly, showCumulativeSavings])

  const monthlyOptions = useMemo(() => {
    // Ensure the y-scale can show negative values when savings/cumulative dips below zero.
    // Without this, negative savings can get clipped at 0 while cumulative still decreases, which looks like a bug.
    const yValues = []

    if (monthly) {
      yValues.push(...monthly.income, ...monthly.expenses, ...monthly.savings)
      if (showCumulativeSavings) yValues.push(...monthly.cumulativeSavings)
    }

    const finite = yValues.filter((v) => Number.isFinite(v))
    const minVal = finite.length ? Math.min(...finite) : 0
    const maxVal = finite.length ? Math.max(...finite) : 0

    const pad = (v) => (Math.abs(v) < 1 ? 0 : Math.abs(v) * 0.08)
    const suggestedMin = Math.min(0, minVal - pad(minVal))
    const suggestedMax = Math.max(0, maxVal + pad(maxVal))

    return {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.6,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#e5e7eb', padding: 16, usePointStyle: true },
        },
        tooltip: {
          backgroundColor: '#020617',
          padding: 12,
          callbacks: {
            title: (items) => (items?.[0]?.label ? `${items[0].label} ${effectiveSelectedYear}` : ''),
            label: (ctx) => {
              const v = ctx.parsed?.y
              if (v == null) return null
              return `${ctx.dataset.label}: ${formatAmount(v)}`
            },
          },
        },
      },
      scales: {
        y: {
          stacked: true,
          suggestedMin,
          suggestedMax,
          ticks: { color: '#d1d5db', callback: (v) => formatAmount(v) },
          grid: { color: 'rgba(255,255,255,0.08)' },
        },
        x: {
          stacked: true,
          ticks: { color: '#d1d5db' },
          grid: { display: false },
        },
      },
    }
  }, [formatAmount, effectiveSelectedYear, monthly, showCumulativeSavings])

  /* ---------- True monthly waterfall (income -> expenses -> savings) ---------- */
  const waterfallData = useMemo(() => {
    if (!monthly || effectiveSelectedYear == null) return null

    // Use floating bars: each bar value is [start, end]
    // For each month, represent:
    // Income: [0, income]
    // Expenses: [income - expenses, income] (subtracting moves down)
    // Savings: [0, savings]
    const incomeFloats = monthLabels.map((_, i) => [0, monthly.income[i]])
    const expenseFloats = monthLabels.map((_, i) => {
      const start = monthly.income[i] - monthly.expenses[i]
      const end = monthly.income[i]
      return [start, end]
    })
    const savingsFloats = monthLabels.map((_, i) => [0, monthly.savings[i]])

    return {
      labels: monthLabels,
      datasets: [
        {
          type: 'bar',
          label: 'Income',
          data: incomeFloats,
          backgroundColor: 'rgba(56,189,248,0.22)',
          borderColor: '#38bdf8',
          borderWidth: 1,
          borderRadius: 8,
        },
        {
          type: 'bar',
          label: 'Expenses',
          data: expenseFloats,
          backgroundColor: 'rgba(244,114,182,0.22)',
          borderColor: '#f472b6',
          borderWidth: 1,
          borderRadius: 8,
        },
        {
          type: 'bar',
          label: 'Savings',
          data: savingsFloats,
          backgroundColor: 'rgba(34,197,94,0.22)',
          borderColor: '#22c55e',
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    }
  }, [monthly, effectiveSelectedYear])

  const waterfallOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.6,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#e5e7eb', padding: 16, usePointStyle: true },
        },
        tooltip: {
          backgroundColor: '#020617',
          padding: 12,
          callbacks: {
            title: (items) => (items?.[0]?.label ? `${items[0].label} ${effectiveSelectedYear}` : ''),
            label: (ctx) => {
              // When using floating bars, parsed.y is an object with start/end in some versions,
              // or number in others. Safely infer the delta from raw data.
              const raw = ctx.raw
              if (Array.isArray(raw) && raw.length === 2) {
                const delta = raw[1] - raw[0]
                return `${ctx.dataset.label}: ${formatAmount(delta)}`
              }
              const v = ctx.parsed?.y
              if (typeof v === 'number') return `${ctx.dataset.label}: ${formatAmount(v)}`
              return null
            },
          },
        },
      },
      scales: {
        y: {
          ticks: { color: '#d1d5db', callback: (v) => formatAmount(v) },
          grid: { color: 'rgba(255,255,255,0.08)' },
        },
        x: {
          ticks: { color: '#d1d5db' },
          grid: { display: false },
        },
      },
    }
  }, [formatAmount, effectiveSelectedYear])

  /* ---------- Category drilldown (expenses) ---------- */
  const categoryDrill = useMemo(() => {
    if (!effectiveSelectedYear) return null

    const curTotals = {}
    const baseTotals = {}

    for (const t of transactions) {
      const dt = safeDate(t.date)
      if (!dt) continue
      if (t.type !== 'expense') continue

      const y = dt.getFullYear()
      const cat = t.category || 'Other'
      const amt = Number(t.amount) || 0

      if (y === effectiveSelectedYear) curTotals[cat] = (curTotals[cat] || 0) + amt
      if (resolvedBaselineYear != null && y === resolvedBaselineYear) baseTotals[cat] = (baseTotals[cat] || 0) + amt
    }

    const entries = Object.entries(curTotals).sort((a, b) => b[1] - a[1])
    const top = entries.slice(0, clamp(topN, 3, 20)).map(([category, amount]) => {
      const base = resolvedBaselineYear != null ? baseTotals[category] || 0 : null
      return {
        category,
        amount,
        baselineAmount: base,
        pct: resolvedBaselineYear != null ? pctChange(amount, base) : null,
        delta: resolvedBaselineYear != null && base != null ? amount - base : null,
      }
    })

    const total = Object.values(curTotals).reduce((a, b) => a + b, 0)
    return { top, total, curTotals, baseTotals }
  }, [transactions, effectiveSelectedYear, resolvedBaselineYear, topN])

  const categoryChartData = useMemo(() => {
    if (!categoryDrill?.top?.length) return null

    const labels = categoryDrill.top.map((r) => r.category)
    const cur = categoryDrill.top.map((r) => r.amount)

    const datasets = [
      {
        label: `Expenses ${effectiveSelectedYear}`,
        data: cur,
        backgroundColor: 'rgba(244,114,182,0.20)',
        borderColor: '#f472b6',
        borderWidth: 1,
        borderRadius: 8,
      },
    ]

    if (resolvedBaselineYear != null) {
      const base = categoryDrill.top.map((r) => r.baselineAmount ?? 0)
      datasets.push({
        label: `Expenses ${resolvedBaselineYear}`,
        data: base,
        backgroundColor: 'rgba(229,231,235,0.10)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        borderRadius: 8,
      })
    }

    return { labels, datasets }
  }, [categoryDrill, effectiveSelectedYear, resolvedBaselineYear])

  const categoryOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.6,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
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
              const v = ctx.parsed?.y
              if (v == null) return null
              return `${ctx.dataset.label}: ${formatAmount(v)}`
            },
          },
        },
      },
      scales: {
        y: {
          ticks: { color: '#d1d5db', callback: (v) => formatAmount(v) },
          grid: { color: 'rgba(255,255,255,0.08)' },
        },
        x: {
          ticks: { color: '#d1d5db' },
          grid: { display: false },
        },
      },
    }
  }, [formatAmount])

  /* ---------- Contribution breakdown (YoY expense delta by category) ---------- */
  const contributions = useMemo(() => {
    if (!effectiveSelectedYear || resolvedBaselineYear == null || !categoryDrill) return null

    const cur = categoryDrill.curTotals || {}
    const base = categoryDrill.baseTotals || {}

    const categories = Array.from(new Set([...Object.keys(cur), ...Object.keys(base)]))

    const deltas = categories
      .map((cat) => {
        const c = cur[cat] || 0
        const b = base[cat] || 0
        const delta = c - b
        return { category: cat, current: c, baseline: b, delta }
      })
      .filter((r) => r.delta !== 0)

    deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

    const top = deltas.slice(0, 12)

    const labels = top.map((r) => r.category)
    const data = top.map((r) => r.delta)
    const colors = top.map((r) => (r.delta > 0 ? 'rgba(244,114,182,0.22)' : 'rgba(34,197,94,0.22)'))
    const borders = top.map((r) => (r.delta > 0 ? '#f472b6' : '#22c55e'))

    return {
      rows: top,
      chart: {
        labels,
        datasets: [
          {
            label: `Expense delta vs ${resolvedBaselineYear}`,
            data,
            backgroundColor: colors,
            borderColor: borders,
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      },
    }
  }, [effectiveSelectedYear, resolvedBaselineYear, categoryDrill])

  const contributionsOptions = useMemo(() => {
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.2,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#e5e7eb', padding: 16, usePointStyle: true },
        },
        tooltip: {
          backgroundColor: '#020617',
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed?.x
              if (v == null) return null
              const sign = v >= 0 ? '+' : ''
              return `${ctx.dataset.label}: ${sign}${formatAmount(v)}`
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#d1d5db',
            callback: (v) => formatAmount(v),
          },
          grid: { color: 'rgba(255,255,255,0.08)' },
        },
        y: {
          ticks: { color: '#d1d5db' },
          grid: { display: false },
        },
      },
    }
  }, [formatAmount])

  /* ---------- Anomaly detection ---------- */
  const anomalies = useMemo(() => {
    if (!effectiveSelectedYear) return []

    const byCategory = new Map()
    for (const t of transactions) {
      const dt = safeDate(t.date)
      if (!dt) continue
      if (dt.getFullYear() !== effectiveSelectedYear) continue
      if (t.type !== 'expense') continue

      const cat = t.category || 'Other'
      const m = dt.getMonth()
      const amt = Number(t.amount) || 0

      if (!byCategory.has(cat)) byCategory.set(cat, Array(12).fill(0))
      byCategory.get(cat)[m] += amt
    }

    const out = []
    for (const [cat, series] of byCategory.entries()) {
      const values = series.filter((v) => v > 0)
      if (values.length < 3) continue

      const m = mean(values)
      const sd = stddev(values)
      if (sd === 0) continue

      series.forEach((v, idx) => {
        if (v <= 0) return
        const z = (v - m) / sd
        if (z >= anomalyZ) {
          out.push({
            category: cat,
            monthIndex: idx,
            month: monthLabels[idx],
            amount: v,
            mean: m,
            sd,
            z,
          })
        }
      })
    }

    out.sort((a, b) => b.z - a.z)
    return out
  }, [transactions, effectiveSelectedYear, anomalyZ])

  /* ---------- KPI helpers ---------- */
  const baselineLabel =
    resolvedBaselineYear == null ? 'Baseline not available' : `Baseline ${resolvedBaselineYear}`

  const incomeDelta = selectedRow && baselineRow ? selectedRow.income - baselineRow.income : null
  const expenseDelta = selectedRow && baselineRow ? selectedRow.expenses - baselineRow.expenses : null
  const savingsDelta = selectedRow && baselineRow ? selectedRow.savings - baselineRow.savings : null

  const incomePct = selectedRow && baselineRow ? pctChange(selectedRow.income, baselineRow.income) : null
  const expensePct = selectedRow && baselineRow ? pctChange(selectedRow.expenses, baselineRow.expenses) : null
  const savingsPct = selectedRow && baselineRow ? pctChange(selectedRow.savings, baselineRow.savings) : null

  const fmtDelta = (delta, pct) => {
    if (resolvedBaselineYear == null || delta == null || pct == null) return baselineLabel
    const sign = pct >= 0 ? '+' : ''
    return `${formatAmount(delta)} (${sign}${pct.toFixed(1)}%) vs ${resolvedBaselineYear}`
  }

  const Pill = ({ label, value, sub }) => (
    <div className="bg-neutral-900 rounded-xl p-4">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="text-lg font-semibold text-neutral-100 tabular-nums mt-1">{value}</div>
      {sub ? <div className="text-xs text-neutral-500 mt-1 tabular-nums">{sub}</div> : null}
    </div>
  )

  /* ---------- Exports ---------- */
  const exportPNG = (ref, filename) => {
    const chart = ref.current
    const base64 = chart?.toBase64Image?.()
    if (!base64) return
    const link = document.createElement('a')
    link.download = filename
    link.href = base64
    link.click()
  }

  const exportMainCSV = () => {
    if (!rowsInRange.length) return
    const header = [
      'Year',
      'Income',
      'Income YoY %',
      'Expenses',
      'Expenses YoY %',
      'Savings',
      'Savings YoY %',
      'Savings Rate %',
    ]
    const lines = rowsInRange.map((r) => [
      r.year,
      r.income,
      r.incomeYoY == null ? '' : r.incomeYoY.toFixed(3),
      r.expenses,
      r.expensesYoY == null ? '' : r.expensesYoY.toFixed(3),
      r.savings,
      r.savingsYoY == null ? '' : r.savingsYoY.toFixed(3),
      r.savingsRate == null ? '' : r.savingsRate.toFixed(3),
    ])
    const csv = [header, ...lines].map((row) => row.join(',')).join('\n')
    downloadBlob(csv, 'year-comparison.csv', 'text/csv')
  }

  const exportCategoryCSV = () => {
    if (!categoryDrill?.top?.length) return
    const header = [
      'Category',
      `Expenses ${effectiveSelectedYear}`,
      resolvedBaselineYear != null ? `Expenses ${resolvedBaselineYear}` : 'Baseline',
      'Delta',
      'Percent change',
    ]
    const lines = categoryDrill.top.map((r) => [
      r.category,
      r.amount,
      resolvedBaselineYear != null ? (r.baselineAmount ?? 0) : '',
      r.delta == null ? '' : r.delta,
      r.pct == null ? '' : r.pct.toFixed(3),
    ])
    const csv = [header, ...lines].map((row) => row.join(',')).join('\n')
    downloadBlob(csv, 'year-categories.csv', 'text/csv')
  }

  const exportMonthlyCSV = () => {
    if (!monthly || effectiveSelectedYear == null) return
    const header = ['Month', 'Income', 'Expenses', 'Savings', 'Cumulative savings']
    const lines = monthLabels.map((m, i) => [
      m,
      monthly.income[i],
      monthly.expenses[i],
      monthly.savings[i],
      monthly.cumulativeSavings[i],
    ])
    const csv = [header, ...lines].map((row) => row.join(',')).join('\n')
    downloadBlob(csv, `monthly_${effectiveSelectedYear}.csv`, 'text/csv')
  }

  const exportInsights = () => {
    if (!selectedRow || !effectiveSelectedYear) return

    const baseLine =
      resolvedBaselineYear == null || !baselineRow
        ? 'No baseline year is available for comparison.\n'
        : `Baseline year is ${resolvedBaselineYear}.\n`

    const lines = []
    lines.push(`Financial Insights Report\n`)
    lines.push(`Selected year: ${effectiveSelectedYear}\n`)
    lines.push(baseLine)

    lines.push(`Summary\n`)
    lines.push(`Income: ${formatAmount(selectedRow.income)}\n`)
    lines.push(`Expenses: ${formatAmount(selectedRow.expenses)}\n`)
    lines.push(`Savings: ${formatAmount(selectedRow.savings)}\n`)
    if (selectedRow.savingsRate != null) {
      lines.push(`Savings rate: ${round1(clamp(selectedRow.savingsRate, -999, 999))}%\n`)
    }

    if (baselineRow && resolvedBaselineYear != null) {
      lines.push(`\nYear over year comparison\n`)
      lines.push(`Income delta: ${fmtDelta(incomeDelta, incomePct)}\n`)
      lines.push(`Expenses delta: ${fmtDelta(expenseDelta, expensePct)}\n`)
      lines.push(`Savings delta: ${fmtDelta(savingsDelta, savingsPct)}\n`)
    }

    if (contributions?.rows?.length) {
      lines.push(`\nTop drivers of expense change vs ${resolvedBaselineYear}\n`)
      contributions.rows.slice(0, 8).forEach((r) => {
        const sign = r.delta >= 0 ? '+' : ''
        lines.push(`${r.category}: ${sign}${formatAmount(r.delta)}\n`)
      })
    }

    if (anomalies?.length) {
      lines.push(`\nDetected expense anomalies\n`)
      anomalies.slice(0, 8).forEach((a) => {
        lines.push(`${a.month} ${a.category}: ${formatAmount(a.amount)} (z ${a.z.toFixed(2)})\n`)
      })
    }

    if (monthly) {
      const bestMonthIdx = monthly.savings
        .map((v, i) => ({ v, i }))
        .sort((a, b) => b.v - a.v)[0]?.i
      const worstMonthIdx = monthly.savings
        .map((v, i) => ({ v, i }))
        .sort((a, b) => a.v - b.v)[0]?.i

      if (bestMonthIdx != null && worstMonthIdx != null) {
        lines.push(`\nMonthly highlights\n`)
        lines.push(`Best savings month: ${monthLabels[bestMonthIdx]} (${formatAmount(monthly.savings[bestMonthIdx])})\n`)
        lines.push(`Weakest savings month: ${monthLabels[worstMonthIdx]} (${formatAmount(monthly.savings[worstMonthIdx])})\n`)
      }
    }

    lines.push(`\nRecommendations\n`)
    lines.push(`Review the largest expense delta categories to confirm they are intentional.\n`)
    lines.push(`If anomalies are present, validate one-time purchases and consider smoothing with budgets.\n`)

    downloadBlob(lines.join(''), `insights_${effectiveSelectedYear}.txt`, 'text/plain')
  }

  /* ---------- Range quick actions ---------- */
  const setRangeAll = () => {
    if (!allYears.length) return
    setRangeStart(allYears[0])
    setRangeEnd(allYears[allYears.length - 1])
  }

  const setRangeLast = (n) => {
    if (!allYears.length) return
    const end = allYears[allYears.length - 1]
    const start = allYears[Math.max(0, allYears.length - n)]
    setRangeStart(start)
    setRangeEnd(end)
  }

  /* ---------- Empty state ---------- */
  if (!allYears.length || !mainChartData) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-neutral-800 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-neutral-200 mb-2">Year Comparison</h2>
        <p className="text-neutral-400 text-sm text-center">Add transactions to compare yearly performance</p>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-neutral-800">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-neutral-200 tracking-tight">Year Comparison</h2>
            <div className="text-sm text-neutral-400 mt-1">
              {effectiveSelectedYear ? `Selected year ${effectiveSelectedYear}` : 'No year selected'}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'categories', label: 'Categories' },
              { key: 'monthly', label: 'Monthly' },
              { key: 'waterfall', label: 'Waterfall' },
              { key: 'contributions', label: 'Drivers' },
              { key: 'anomalies', label: 'Anomalies' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  tab === t.key ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-300 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-neutral-400 mb-2">Year range</div>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={rangeStart ?? ''}
                  onChange={(e) => setRangeStart(Number(e.target.value))}
                  className="bg-neutral-800 text-neutral-200 rounded-lg px-2.5 py-2 text-sm"
                >
                  {allYears.map((y) => (
                    <option key={`start-${y}`} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <span className="text-neutral-500 text-sm">to</span>

                <select
                  value={rangeEnd ?? ''}
                  onChange={(e) => setRangeEnd(Number(e.target.value))}
                  className="bg-neutral-800 text-neutral-200 rounded-lg px-2.5 py-2 text-sm"
                >
                  {allYears.map((y) => (
                    <option key={`end-${y}`} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <button
                  onClick={setRangeAll}
                  className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                >
                  All
                </button>
                <button
                  onClick={() => setRangeLast(5)}
                  className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                >
                  Last 5
                </button>
                <button
                  onClick={() => setRangeLast(10)}
                  className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                >
                  Last 10
                </button>
              </div>
              <div className="text-xs text-neutral-500 mt-2">
                Click the main chart to select a year.
              </div>
            </div>

            <div>
              <div className="text-xs text-neutral-400 mb-2">Baseline comparison</div>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => setBaselineMode('prior')}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    baselineMode === 'prior' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  Prior year
                </button>
                <button
                  onClick={() => setBaselineMode('custom')}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    baselineMode === 'custom' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  Choose year
                </button>

                {baselineMode === 'custom' && (
                  <select
                    value={baselineYear ?? ''}
                    onChange={(e) => setBaselineYear(Number(e.target.value))}
                    className="bg-neutral-800 text-neutral-200 rounded-lg px-2.5 py-2 text-sm"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {allYears.map((y) => (
                      <option key={`base-${y}`} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="text-xs text-neutral-500 mt-2">{baselineLabel}</div>
            </div>

            <div>
              <div className="text-xs text-neutral-400 mb-2">Main chart settings</div>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => setChartMode((m) => (m === 'grouped' ? 'savings' : 'grouped'))}
                  className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                >
                  {chartMode === 'grouped' ? 'Savings only' : 'Grouped'}
                </button>
                <button
                  onClick={() => setValueMode((m) => (m === 'absolute' ? 'yoy' : 'absolute'))}
                  className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                >
                  {valueMode === 'absolute' ? 'Show YoY' : 'Show absolute'}
                </button>
                <button
                  onClick={() => setShowRollingAvg((v) => !v)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    showRollingAvg ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  Rolling avg
                </button>
                <select
                  value={rollingWindow}
                  onChange={(e) => setRollingWindow(Number(e.target.value))}
                  className="bg-neutral-800 text-neutral-200 rounded-lg px-2.5 py-2 text-sm"
                  disabled={!showRollingAvg}
                >
                  <option value={2}>2-year</option>
                  <option value={3}>3-year</option>
                  <option value={4}>4-year</option>
                </select>

                <button
                  onClick={() => exportPNG(mainChartRef, 'year-comparison.png')}
                  className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                >
                  Export PNG
                </button>
                <button
                  onClick={exportMainCSV}
                  className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                >
                  Export CSV
                </button>
                <button
                  onClick={exportInsights}
                  className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                >
                  Export insights
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedRow && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Pill label="Income" value={formatAmount(selectedRow.income)} sub={fmtDelta(incomeDelta, incomePct)} />
          <Pill label="Expenses" value={formatAmount(selectedRow.expenses)} sub={fmtDelta(expenseDelta, expensePct)} />
          <Pill
            label="Savings"
            value={formatAmount(selectedRow.savings)}
            sub={
              selectedRow.savingsRate == null
                ? fmtDelta(savingsDelta, savingsPct)
                : `${fmtDelta(savingsDelta, savingsPct)}. Savings rate ${round1(clamp(selectedRow.savingsRate, -999, 999))}%`
            }
          />
        </div>
      )}

      <div className="mb-8">
        <Bar ref={mainChartRef} data={mainChartData} options={mainChartOptions} />
        <div className="text-xs text-neutral-500 mt-2">
          Selecting a year updates the KPI panel and all secondary views.
        </div>
      </div>

      {tab === 'overview' && (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-3 px-3 font-medium text-neutral-300">Year</th>
                <th className="text-right py-3 px-3 font-medium text-neutral-300">Income</th>
                <th className="text-right py-3 px-3 font-medium text-neutral-300">YoY</th>
                <th className="text-right py-3 px-3 font-medium text-neutral-300">Expenses</th>
                <th className="text-right py-3 px-3 font-medium text-neutral-300">YoY</th>
                <th className="text-right py-3 px-3 font-medium text-neutral-300">Savings</th>
                <th className="text-right py-3 px-3 font-medium text-neutral-300">YoY</th>
                <th className="text-right py-3 px-3 font-medium text-neutral-300">Rate</th>
              </tr>
            </thead>
            <tbody>
              {rowsInRange.map((r) => {
                const isSelected = r.year === effectiveSelectedYear
                const yoyColor = (v) =>
                  v == null ? 'text-neutral-500' : v >= 0 ? 'text-green-400' : 'text-red-400'
                const fmtPct = (v) => (v == null ? '' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`)

                return (
                  <tr
                    key={r.year}
                    onClick={() => setSelectedYear(r.year)}
                    className={`border-b border-neutral-900 hover:bg-neutral-900 transition-colors cursor-pointer ${
                      isSelected ? 'bg-neutral-900' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-neutral-200">{r.year}</td>
                    <td className="py-3 px-3 text-right text-neutral-200 tabular-nums">{formatAmount(r.income)}</td>
                    <td className={`py-3 px-3 text-right tabular-nums ${yoyColor(r.incomeYoY)}`}>{fmtPct(r.incomeYoY) || 'N/A'}</td>
                    <td className="py-3 px-3 text-right text-neutral-200 tabular-nums">{formatAmount(r.expenses)}</td>
                    <td className={`py-3 px-3 text-right tabular-nums ${yoyColor(r.expensesYoY)}`}>{fmtPct(r.expensesYoY) || 'N/A'}</td>
                    <td className={`py-3 px-3 text-right font-semibold tabular-nums ${r.savings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatAmount(r.savings)}
                    </td>
                    <td className={`py-3 px-3 text-right tabular-nums ${yoyColor(r.savingsYoY)}`}>{fmtPct(r.savingsYoY) || 'N/A'}</td>
                    <td className="py-3 px-3 text-right text-neutral-400 tabular-nums">
                      {r.savingsRate == null ? 'N/A' : `${round1(clamp(r.savingsRate, -999, 999))}%`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'categories' && (
        <div className="bg-neutral-900 rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div>
              <div className="text-sm font-semibold text-neutral-200">Expense categories</div>
              <div className="text-xs text-neutral-500 mt-1">
                {effectiveSelectedYear
                  ? resolvedBaselineYear != null
                    ? `Comparing ${effectiveSelectedYear} to ${resolvedBaselineYear}`
                    : `Viewing ${effectiveSelectedYear}`
                  : 'No year selected'}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-xs text-neutral-500">Top</div>
              <select
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="bg-neutral-800 text-neutral-200 rounded-lg px-2.5 py-2 text-sm"
              >
                {[5, 8, 10, 12, 15, 20].map((n) => (
                  <option key={`top-${n}`} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <button
                onClick={() => exportPNG(categoryChartRef, 'year-categories.png')}
                className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              >
                Export chart
              </button>
              <button
                onClick={exportCategoryCSV}
                className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>

          {categoryDrill?.total != null && (
            <div className="text-sm text-neutral-300 mb-4 tabular-nums">
              Total expenses {formatAmount(categoryDrill.total)}
            </div>
          )}

          {categoryChartData ? (
            <div className="mb-6">
              <Bar ref={categoryChartRef} data={categoryChartData} options={categoryOptions} />
            </div>
          ) : (
            <div className="text-sm text-neutral-500 mb-6">No category data available for this year.</div>
          )}
        </div>
      )}

      {tab === 'monthly' && (
        <div className="bg-neutral-900 rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div>
              <div className="text-sm font-semibold text-neutral-200">Monthly breakdown</div>
              <div className="text-xs text-neutral-500 mt-1">
                {effectiveSelectedYear ? `Income, expenses, and savings by month for ${effectiveSelectedYear}` : 'No year selected'}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setShowCumulativeSavings((v) => !v)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  showCumulativeSavings ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                Cumulative savings
              </button>
              <button
                onClick={() => exportPNG(monthlyChartRef, `monthly_${effectiveSelectedYear}.png`)}
                className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              >
                Export chart
              </button>
              <button
                onClick={exportMonthlyCSV}
                className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>

          {monthlyChartData ? (
            <Bar ref={monthlyChartRef} data={monthlyChartData} options={monthlyOptions} />
          ) : (
            <div className="text-sm text-neutral-500">No monthly data available.</div>
          )}
        </div>
      )}

      {tab === 'waterfall' && (
        <div className="bg-neutral-900 rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div>
              <div className="text-sm font-semibold text-neutral-200">Monthly waterfall</div>
              <div className="text-xs text-neutral-500 mt-1">
                {effectiveSelectedYear ? `Income and expenses flow into savings for ${effectiveSelectedYear}` : 'No year selected'}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => exportPNG(waterfallRef, `waterfall_${effectiveSelectedYear}.png`)}
                className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              >
                Export chart
              </button>
            </div>
          </div>

          {waterfallData ? (
            <Bar ref={waterfallRef} data={waterfallData} options={waterfallOptions} />
          ) : (
            <div className="text-sm text-neutral-500">No data available for the waterfall.</div>
          )}
        </div>
      )}

      {tab === 'contributions' && (
        <div className="bg-neutral-900 rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div>
              <div className="text-sm font-semibold text-neutral-200">Expense change drivers</div>
              <div className="text-xs text-neutral-500 mt-1">
                {effectiveSelectedYear && resolvedBaselineYear != null
                  ? `Largest category deltas comparing ${effectiveSelectedYear} to ${resolvedBaselineYear}`
                  : 'Select a baseline year to view drivers'}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => exportPNG(contributionsRef, `drivers_${effectiveSelectedYear}.png`)}
                className="px-3 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              >
                Export chart
              </button>
            </div>
          </div>

          {contributions?.chart ? (
            <>
              <Bar ref={contributionsRef} data={contributions.chart} options={contributionsOptions} />
              <div className="text-xs text-neutral-500 mt-3">
                Positive values indicate higher spending than baseline. Negative values indicate lower spending than baseline.
              </div>
            </>
          ) : (
            <div className="text-sm text-neutral-500">
              Drivers require a baseline year and expense data in both years.
            </div>
          )}
        </div>
      )}

      {tab === 'anomalies' && (
        <div className="bg-neutral-900 rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div>
              <div className="text-sm font-semibold text-neutral-200">Anomaly detection</div>
              <div className="text-xs text-neutral-500 mt-1">
                Flags unusually high expense months per category using z-scores.
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-xs text-neutral-500">Threshold</div>
              <select
                value={anomalyZ}
                onChange={(e) => setAnomalyZ(Number(e.target.value))}
                className="bg-neutral-800 text-neutral-200 rounded-lg px-2.5 py-2 text-sm"
              >
                {[1.5, 2, 2.5, 3].map((z) => (
                  <option key={`z-${z}`} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!effectiveSelectedYear ? (
            <div className="text-sm text-neutral-500">Select a year to view anomalies.</div>
          ) : anomalies.length === 0 ? (
            <div className="text-sm text-neutral-500">
              No anomalies detected for {effectiveSelectedYear} at the current threshold.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-2.5 px-3 font-medium text-neutral-300">Category</th>
                    <th className="text-left py-2.5 px-3 font-medium text-neutral-300">Month</th>
                    <th className="text-right py-2.5 px-3 font-medium text-neutral-300">Amount</th>
                    <th className="text-right py-2.5 px-3 font-medium text-neutral-300">Category mean</th>
                    <th className="text-right py-2.5 px-3 font-medium text-neutral-300">Z-score</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.map((a, idx) => (
                    <tr key={`${a.category}-${a.monthIndex}-${idx}`} className="border-b border-neutral-950 hover:bg-neutral-800 transition-colors">
                      <td className="py-3 px-3 text-neutral-200 font-medium">{a.category}</td>
                      <td className="py-3 px-3 text-neutral-300">{a.month}</td>
                      <td className="py-3 px-3 text-right text-neutral-200 tabular-nums">{formatAmount(a.amount)}</td>
                      <td className="py-3 px-3 text-right text-neutral-400 tabular-nums">{formatAmount(a.mean)}</td>
                      <td className="py-3 px-3 text-right text-neutral-200 tabular-nums">{a.z.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-xs text-neutral-500 mt-3">
                Anomalies are computed per category across months with non-zero values. Categories with too few active months are excluded.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default YearComparison
