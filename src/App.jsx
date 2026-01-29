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
/* Date Range Helpers (Fixed for inclusive end dates) */
/* -------------------------------------------------- */

/**
 * Returns a month range with inclusive start and end dates.
 * @param {number} offset - Number of months to go back (0 = current month)
 * @returns {{ start: Date, end: Date }}
 */
const getMonthRange = (offset = 0) => {
  const now = new Date()
  
  // Start of the target month
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1)
  start.setHours(0, 0, 0, 0)

  // End of the target month (last millisecond)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
  end.setMilliseconds(-1) // Go back 1ms to get 23:59:59.999 of last day

  return { start, end }
}

/**
 * Returns a year range with inclusive start and end dates.
 * @param {number} offset - Number of years to go back (0 = current year)
 * @returns {{ start: Date, end: Date }}
 */
const getYearRange = (offset = 0) => {
  const year = new Date().getFullYear() - offset

  // Start of the target year
  const start = new Date(year, 0, 1)
  start.setHours(0, 0, 0, 0)

  // End of the target year (last millisecond of Dec 31)
  const end = new Date(year + 1, 0, 1)
  end.setMilliseconds(-1) // Go back 1ms to get 23:59:59.999 of Dec 31

  return { start, end }
}

/**
 * Computes comparison periods based on the selected mode.
 * @param {'none' | 'month' | 'year'} mode
 * @returns {{ currentPeriod?: { start: Date, end: Date }, previousPeriod?: { start: Date, end: Date } }}
 */
const getComparisonPeriods = (mode) => {
  if (mode === 'none') {
    return { currentPeriod: null, previousPeriod: null }
  }

  if (mode === 'year') {
    return {
      currentPeriod: getYearRange(0),
      previousPeriod: getYearRange(1),
    }
  }

  // Default: month over month
  return {
    currentPeriod: getMonthRange(0),
    previousPeriod: getMonthRange(1),
  }
}

/**
 * Formats a date for display in the debug overlay.
 * @param {Date | null | undefined} date
 * @returns {string}
 */
const formatDebugDate = (date) => {
  if (!date) return 'N/A'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Returns a human-readable label for the current period.
 * @param {'none' | 'month' | 'year'} mode
 * @param {{ start: Date, end: Date } | null} period
 * @returns {string}
 */
const getPeriodLabel = (mode, period) => {
  if (mode === 'none' || !period) return ''
  
  if (mode === 'month') {
    return period.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  
  return period.start.getFullYear().toString()
}

/* -------------------------------------------------- */
/* Debug Overlay Component */
/* -------------------------------------------------- */
function DebugOverlay({ comparisonMode, currentPeriod, previousPeriod, transactions }) {
  const [isVisible, setIsVisible] = useState(false)

  // Count transactions in each period
  const currentCount = useMemo(() => {
    if (!currentPeriod) return 0
    return transactions.filter((t) => {
      const date = new Date(t.date)
      return date >= currentPeriod.start && date <= currentPeriod.end
    }).length
  }, [transactions, currentPeriod])

  const previousCount = useMemo(() => {
    if (!previousPeriod) return 0
    return transactions.filter((t) => {
      const date = new Date(t.date)
      return date >= previousPeriod.start && date <= previousPeriod.end
    }).length
  }, [transactions, previousPeriod])

  // Only show in development
  if (import.meta.env.PROD) return null

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
        title="Toggle Debug Overlay"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 w-80 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-4 text-xs font-mono">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-violet-400 font-semibold text-sm">Date Range Debug</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-neutral-500 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Mode */}
            <div className="flex justify-between">
              <span className="text-neutral-500">Mode:</span>
              <span className="text-white">{comparisonMode}</span>
            </div>

            {/* Current Period */}
            <div className="bg-neutral-800 rounded-lg p-2">
              <div className="text-green-400 mb-1">Current Period</div>
              <div className="text-neutral-400">
                Start: <span className="text-white">{formatDebugDate(currentPeriod?.start)}</span>
              </div>
              <div className="text-neutral-400">
                End: <span className="text-white">{formatDebugDate(currentPeriod?.end)}</span>
              </div>
              <div className="text-neutral-400 mt-1">
                Transactions: <span className="text-green-400">{currentCount}</span>
              </div>
            </div>

            {/* Previous Period */}
            <div className="bg-neutral-800 rounded-lg p-2">
              <div className="text-yellow-400 mb-1">Previous Period</div>
              <div className="text-neutral-400">
                Start: <span className="text-white">{formatDebugDate(previousPeriod?.start)}</span>
              </div>
              <div className="text-neutral-400">
                End: <span className="text-white">{formatDebugDate(previousPeriod?.end)}</span>
              </div>
              <div className="text-neutral-400 mt-1">
                Transactions: <span className="text-yellow-400">{previousCount}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between pt-2 border-t border-neutral-700">
              <span className="text-neutral-500">Total Transactions:</span>
              <span className="text-white">{transactions.length}</span>
            </div>
          </div>
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
    return saved ? JSON.parse(saved) : {}
  })

  const [focusedCategory, setFocusedCategory] = useState(null)
  const [comparisonMode, setComparisonMode] = useState('none') // none | month | year

  /* ---------- Persistence ---------- */
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets))
  }, [budgets])

  /* ---------- Comparison Periods ---------- */
  const { currentPeriod, previousPeriod } = useMemo(
    () => getComparisonPeriods(comparisonMode),
    [comparisonMode]
  )

  /* ---------- Period Label ---------- */
  const periodLabel = useMemo(
    () => getPeriodLabel(comparisonMode, currentPeriod),
    [comparisonMode, currentPeriod]
  )

  /* ---------- CRUD ---------- */
  const addTransaction = (transaction) => {
    setTransactions([transaction, ...transactions])
  }

  const editTransaction = (id, updatedTransaction) => {
    setTransactions(
      transactions.map((t) =>
        t.id === id ? { ...updatedTransaction, id } : t
      )
    )
  }

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id))
  }

  /* ---------- Export ---------- */
  const exportToCSV = () => {
    if (!transactions.length) {
      alert('No transactions to export!')
      return
    }

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount']
    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category,
      t.type,
      t.amount.toFixed(2),
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transactions_${new Date()
      .toISOString()
      .split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white text-center mb-3">
            Finance
          </h1>

          <p className="text-center text-neutral-400 text-base sm:text-lg">
            Track your income and expenses
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-6">
            <CurrencySelector />

            {transactions.length > 0 && (
              <button
                onClick={exportToCSV}
                className="px-5 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition-colors"
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
        <section className="mb-6 flex flex-col items-center gap-2">
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
          
          {/* Active Period Label */}
          {periodLabel && (
            <span className="text-xs text-neutral-500">
              Viewing: {periodLabel}
            </span>
          )}
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <PieChart
            transactions={transactions}
            currentPeriod={currentPeriod}
            previousPeriod={previousPeriod}
            onCategoryFocus={setFocusedCategory}
          />

          <LineChart
            transactions={transactions}
            focusedCategory={focusedCategory}
            currentPeriod={currentPeriod}
          />
        </section>

        {/* Budget Manager */}
        <section className="mb-12 sm:mb-16">
          <BudgetManager
            budgets={budgets}
            setBudgets={setBudgets}
            transactions={transactions}
          />
        </section>

        {/* Year Comparison */}
        <section className="mb-12 sm:mb-16">
          <YearComparison transactions={transactions} />
        </section>

        {/* Transactions */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <TransactionForm onAddTransaction={addTransaction} />
          <TransactionList
            transactions={transactions}
            onDeleteTransaction={deleteTransaction}
            onEditTransaction={editTransaction}
          />
        </section>
      </div>

      {/* Debug Overlay (development only) */}
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