import { useState, useEffect, useMemo } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import Summary from './components/Summary'
import PieChart from './components/PieChart'
import LineChart from './components/LineChart'
import PrivacyPolicy from './components/PrivacyPolicy'
import CurrencySelector from './components/CurrencySelector'
import BudgetManager from './components/BudgetManager'
import YearComparison from './components/YearComparison'

/* -------------------------------------------------- */
/* Date Helpers */
/* -------------------------------------------------- */

const monthKeyFromDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const getMonthRangeFromDate = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  end.setMilliseconds(-1)

  return { start, end }
}

const getYearRangeFromDate = (date) => {
  const year = date.getFullYear()

  const start = new Date(year, 0, 1)
  start.setHours(0, 0, 0, 0)

  const end = new Date(year + 1, 0, 1)
  end.setMilliseconds(-1)

  return { start, end }
}

const getPeriodLabel = (mode, date) => {
  if (mode === 'month') {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }

  if (mode === 'year') {
    return date.getFullYear().toString()
  }

  return ''
}

/* -------------------------------------------------- */
/* Budget LocalStorage Migration */
/* -------------------------------------------------- */
/**
 * Supports both:
 * 1) Old format: { Housing: 900, Food: 300 }
 * 2) New format: { "2026-01": { Housing: 900 } }
 */
const normalizeBudgets = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}

  const values = Object.values(raw)
  if (values.length === 0) return {}

  const firstVal = values[0]

  const isNewFormat =
    firstVal &&
    typeof firstVal === 'object' &&
    !Array.isArray(firstVal)

  if (isNewFormat) return raw

  const isOldFormat = values.every((v) => typeof v === 'number')
  if (!isOldFormat) return {}

  // migrate old format into current month
  const key = monthKeyFromDate(new Date())
  return { [key]: raw }
}

/* -------------------------------------------------- */
/* Debug Overlay */
/* -------------------------------------------------- */
function DebugOverlay({
  comparisonMode,
  currentPeriod,
  previousPeriod,
  transactions,
}) {
  const [isVisible, setIsVisible] = useState(false)

  if (import.meta.env.PROD) return null

  const countInRange = (range) =>
    !range
      ? 0
      : transactions.filter((t) => {
          const d = new Date(t.date)
          return d >= range.start && d <= range.end
        }).length

  return (
    <>
      <button
        onClick={() => setIsVisible((v) => !v)}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 bg-violet-600 text-white rounded-full"
        title="Toggle Debug"
      >
        ⚙
      </button>

      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 w-80 bg-neutral-900 border border-neutral-700 rounded-xl p-4 text-xs font-mono">
          <div className="text-violet-400 mb-2">Debug</div>
          <div>Mode: {comparisonMode}</div>
          <div>Current: {countInRange(currentPeriod)}</div>
          <div>Previous: {countInRange(previousPeriod)}</div>
          <div>Total: {transactions.length}</div>
        </div>
      )}
    </>
  )
}

/* -------------------------------------------------- */
/* Dashboard */
/* -------------------------------------------------- */
function Dashboard() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions')
    return saved ? JSON.parse(saved) : []
  })

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('budgets')
    const parsed = saved ? JSON.parse(saved) : {}
    return normalizeBudgets(parsed)
  })

  const [comparisonMode, setComparisonMode] = useState('none')
  const [focusedCategory, setFocusedCategory] = useState(null)

  // controls which month/year is being viewed
  const [viewDate, setViewDate] = useState(new Date())

  /* ---------- Persistence ---------- */
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets))
  }, [budgets])

  /* ---------- Periods ---------- */
  // Key fix: even when comparisonMode = 'none', we still set a usable month range
  const currentPeriod = useMemo(() => {
    if (comparisonMode === 'year') return getYearRangeFromDate(viewDate)
    // month OR none => month range (so budgets work always)
    return getMonthRangeFromDate(viewDate)
  }, [comparisonMode, viewDate])

  const previousPeriod = useMemo(() => {
    if (comparisonMode === 'month') {
      const prev = new Date(viewDate)
      prev.setMonth(prev.getMonth() - 1)
      return getMonthRangeFromDate(prev)
    }

    if (comparisonMode === 'year') {
      const prev = new Date(viewDate)
      prev.setFullYear(prev.getFullYear() - 1)
      return getYearRangeFromDate(prev)
    }

    return null
  }, [comparisonMode, viewDate])

  const periodLabel = useMemo(() => {
    if (comparisonMode === 'year') return getPeriodLabel('year', viewDate)
    // month OR none => show month label
    return getPeriodLabel('month', viewDate)
  }, [comparisonMode, viewDate])

  /* ---------- CRUD ---------- */
  const addTransaction = (t) => setTransactions([t, ...transactions])

  const deleteTransaction = (id) =>
    setTransactions(transactions.filter((t) => t.id !== id))

  const editTransaction = (id, updated) =>
    setTransactions(transactions.map((t) => (t.id === id ? { ...updated, id } : t)))

  /* ---------- Export ---------- */
  const exportToCSV = () => {
    if (!transactions.length) return alert('No transactions')

    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category,
      t.type,
      t.amount.toFixed(2),
    ])

    const csv = [
      ['Date', 'Description', 'Category', 'Type', 'Amount'].join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-semibold text-white">Finance</h1>
          <p className="text-neutral-400 mt-2">
            Track your income and expenses
          </p>

          <div className="flex justify-center gap-3 mt-6">
            <CurrencySelector />
            {transactions.length > 0 && (
              <button
                onClick={exportToCSV}
                className="px-5 py-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
              >
                Export CSV
              </button>
            )}
          </div>
        </header>

        {/* Summary */}
        <section className="mb-12 sm:mb-16">
          <Summary transactions={transactions} />
        </section>

        {/* Comparison Controls */}
        <section className="mb-6 flex flex-col items-center gap-3">
          <div className="bg-neutral-800 rounded-full p-1 flex gap-1 text-sm">
            {[
              { label: 'No Comparison', value: 'none' },
              { label: 'Month', value: 'month' },
              { label: 'Year', value: 'year' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setComparisonMode(opt.value)}
                className={`px-4 py-1.5 rounded-full transition-colors ${
                  comparisonMode === opt.value
                    ? 'bg-white text-black'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Month navigation for month-based views (none/month) */}
          {comparisonMode !== 'year' && (
            <div className="flex items-center gap-4 text-sm text-neutral-300">
              <button
                onClick={() =>
                  setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                }
                className="px-2 py-1 rounded hover:bg-neutral-800 transition"
                aria-label="Previous month"
              >
                ←
              </button>

              <span className="text-neutral-400">{periodLabel}</span>

              <button
                onClick={() =>
                  setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                }
                className="px-2 py-1 rounded hover:bg-neutral-800 transition"
                aria-label="Next month"
              >
                →
              </button>
            </div>
          )}
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <PieChart
            transactions={transactions}
            currentPeriod={comparisonMode === 'none' ? null : currentPeriod}
            previousPeriod={previousPeriod}
            onCategoryFocus={setFocusedCategory}
          />

          <LineChart
            transactions={transactions}
            currentPeriod={currentPeriod}
            focusedCategory={focusedCategory}
          />
        </section>

        {/* Budget */}
        <section className="mb-12 sm:mb-16">
          <BudgetManager
            budgets={budgets}
            setBudgets={setBudgets}
            transactions={transactions}
            currentPeriod={currentPeriod}
            focusedCategory={focusedCategory}
          />
        </section>

        {/* Year Comparison */}
        <section className="mb-12 sm:mb-16">
          <YearComparison transactions={transactions} />
        </section>

        {/* Transactions */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
          <TransactionForm onAddTransaction={addTransaction} />

          <TransactionList
            transactions={transactions}
            onDeleteTransaction={deleteTransaction}
            onEditTransaction={editTransaction}
            onHoverCategory={setFocusedCategory}
          />
        </section>
      </div>

      <DebugOverlay
        comparisonMode={comparisonMode}
        currentPeriod={currentPeriod}
        previousPeriod={previousPeriod}
        transactions={transactions}
      />
    </div>
  )
}

/* -------------------------------------------------- */
/* App */
/* -------------------------------------------------- */
function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-950">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>

        {/* Footer */}
        <footer className="py-10 text-center border-t border-neutral-800">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/privacy"
              className="text-neutral-500 hover:text-white text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="https://github.com/Crespo1301"
              className="text-neutral-500 hover:text-white text-sm transition-colors"
            >
              GitHub Repository
            </Link>
            <Link
              to="https://www.linkedin.com/in/carlos-crespo-46608014a/"
              className="text-neutral-500 hover:text-white text-sm transition-colors"
            >
              LinkedIn Profile
            </Link>
          </div>

          <p className="mt-4 text-neutral-500 text-sm">
            © {new Date().getFullYear()} Carlos Crespo. All rights reserved.
          </p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
