import { useRef, useState, useEffect, useMemo } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import Summary from './components/Summary'
import PieChart from './components/PieChart'
import LineChart from './components/LineChart'
import PrivacyPolicy from './components/PrivacyPolicy'
import Terms from './components/Terms'
import Settings from './components/Settings'
import CurrencySelector from './components/CurrencySelector'
import BudgetManager from './components/BudgetManager'
import YearComparison from './components/YearComparison'
import AdsSlot from './components/AdsSlot'
import Footer from './components/Footer'
import ConsentBanner from './components/ConsentBanner'
import PrivacyPreferencesModal from './components/PrivacyPreferencesModal'
import { useCurrency } from './context/CurrencyContext'

const BACKUP_SCHEMA_VERSION = 2

const safeParseJSON = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const toSafeISO = (dateLike) => {
  const d = new Date(dateLike)
  return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString()
}

const sanitizeTransactions = (arr) => {
  if (!Array.isArray(arr)) return []
  return arr
    .map((t) => {
      if (!t || typeof t !== 'object') return null
      const type = t.type === 'income' ? 'income' : 'expense'
      const amount = Number(t.amount)
      const id = t.id ?? Date.now() + Math.floor(Math.random() * 100000)
      return {
        id,
        description: String(t.description ?? ''),
        category: String(t.category ?? 'Other') || 'Other',
        type,
        amount: Number.isFinite(amount) ? amount : 0,
        date: toSafeISO(t.date),
      }
    })
    .filter(Boolean)
}

const sanitizeBudgets = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {}
  const next = {}
  for (const [monthKey, cats] of Object.entries(obj)) {
    if (!cats || typeof cats !== 'object' || Array.isArray(cats)) continue
    const cleanCats = {}
    for (const [cat, limit] of Object.entries(cats)) {
      const n = Number(limit)
      if (Number.isFinite(n) && n > 0) cleanCats[String(cat)] = n
    }
    next[String(monthKey)] = cleanCats
  }
  return next
}

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

  if (mode === 'year') return date.getFullYear().toString()
  return ''
}

function DebugOverlay({ comparisonMode, currentPeriod, previousPeriod, transactions }) {
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
        title="Toggle Debug Overlay"
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

function Dashboard() {
  const fileInputRef = useRef(null)

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions')
    return saved ? JSON.parse(saved) : []
  })

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('budgets')
    return saved ? JSON.parse(saved) : {}
  })

  const [comparisonMode, setComparisonMode] = useState('none')
  const [focusedCategory, setFocusedCategory] = useState(null)
  const [viewDate, setViewDate] = useState(new Date())

  const { currency, setCurrency } = useCurrency()

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets))
  }, [budgets])

  const currentPeriod = useMemo(() => {
    if (comparisonMode === 'year') return getYearRangeFromDate(viewDate)
    if (comparisonMode === 'month') return getMonthRangeFromDate(viewDate)
    return null
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

  const periodLabel = getPeriodLabel(comparisonMode, viewDate)

  const addTransaction = (t) => setTransactions((prev) => [t, ...prev])

  const deleteTransaction = (id) => setTransactions((prev) => prev.filter((t) => t.id !== id))

  const editTransaction = (id, updated) =>
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...updated, id } : t)))

  const duplicateTransaction = (transaction) => {
    if (!transaction) return null
    const clone = { ...transaction, id: Date.now() + Math.floor(Math.random() * 100000) }
    setTransactions((prev) => [clone, ...prev])
    return clone
  }

  const bulkDeleteTransactions = (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return
    const idSet = new Set(ids)
    setTransactions((prev) => prev.filter((t) => !idSet.has(t.id)))
  }

  const exportToCSV = () => {
    if (!transactions.length) return alert('No transactions')

    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category,
      t.type,
      Number(t.amount || 0).toFixed(2),
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

  const exportBackupJSON = () => {
    const presetsRaw = localStorage.getItem('transactionListPresets_v1')
    const backup = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        transactions,
        budgets,
        currency,
        presets: safeParseJSON(presetsRaw) || [],
        theme: localStorage.getItem('theme') || null,
        lastTxType: localStorage.getItem('last_tx_type') || null,
        lastTxCategory: localStorage.getItem('last_tx_category') || null,
        privacyPreferences: safeParseJSON(localStorage.getItem('privacyPreferences_v1')) || null,
      },
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance_dashboard_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const requestRestore = () => {
    fileInputRef.current?.click()
  }

  const restoreFromBackupFile = async (file) => {
    if (!file) return
    try {
      const text = await file.text()
      const parsed = safeParseJSON(text)
      if (!parsed || typeof parsed !== 'object') {
        alert('Invalid backup file.')
        return
      }

      const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed

      // Safety backup before restore
      try {
        const pre = {
          schemaVersion: BACKUP_SCHEMA_VERSION,
          exportedAt: new Date().toISOString(),
          data: {
            transactions,
            budgets,
            currency,
            presets: safeParseJSON(localStorage.getItem('transactionListPresets_v1')) || [],
            theme: localStorage.getItem('theme') || null,
            lastTxType: localStorage.getItem('last_tx_type') || null,
            lastTxCategory: localStorage.getItem('last_tx_category') || null,
        privacyPreferences: safeParseJSON(localStorage.getItem('privacyPreferences_v1')) || null,
          },
        }
        localStorage.setItem('backup_before_last_restore_v1', JSON.stringify(pre))
      } catch {
        // ignore
      }

      setTransactions(sanitizeTransactions(data.transactions))
      setBudgets(sanitizeBudgets(data.budgets))

      if (typeof data.currency === 'string') setCurrency(data.currency)

      if (Array.isArray(data.presets)) {
        localStorage.setItem('transactionListPresets_v1', JSON.stringify(data.presets))
        window.dispatchEvent(new CustomEvent('transactionListPresetsUpdated'))
      }

      if (typeof data.theme === 'string') localStorage.setItem('theme', data.theme)
      if (typeof data.lastTxType === 'string') localStorage.setItem('last_tx_type', data.lastTxType)
      if (typeof data.lastTxCategory === 'string') localStorage.setItem('last_tx_category', data.lastTxCategory)

      alert('Restore complete.')
    } catch (e) {
      console.error(e)
      alert('Could not restore from this file.')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-5xl font-semibold text-white">Finance</h1>
            <p className="text-neutral-400 mt-2">Track your income and expenses</p>

            <div className="flex justify-center gap-3 mt-6 flex-wrap">
              <CurrencySelector />
              {transactions.length > 0 && (
                <button onClick={exportToCSV} className="px-5 py-2 rounded-full bg-neutral-800 text-white">
                  Export CSV
                </button>
              )}

              <button
                onClick={exportBackupJSON}
                className="px-5 py-2 rounded-full bg-neutral-800 text-white"
                title="Download a full backup (transactions, budgets, presets, settings)"
              >
                Backup JSON
              </button>

              <button
                onClick={requestRestore}
                className="px-5 py-2 rounded-full bg-neutral-800 text-white"
                title="Restore from a previously exported backup"
              >
                Restore
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  restoreFromBackupFile(f)
                }}
              />

              <Link
                to="/settings"
                className="px-5 py-2 rounded-full bg-neutral-800 text-white inline-flex items-center justify-center"
                title="Data portability, privacy, and reset options"
              >
                Settings
              </Link>

            </div>
          </header>

          <section className="mb-12 sm:mb-16">
            <Summary transactions={transactions} />
          </section>

          <section className="mb-6 flex flex-col items-center gap-2">
            <div className="bg-neutral-800 rounded-full p-1 flex gap-1 text-sm">
              {['none', 'month', 'year'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setComparisonMode(mode)}
                  className={`px-4 py-1.5 rounded-full ${
                    comparisonMode === mode ? 'bg-white text-black' : 'text-neutral-300'
                  }`}
                >
                  {mode === 'none' ? 'No Comparison' : mode}
                </button>
              ))}
            </div>

            {comparisonMode !== 'year' && (
              <div className="flex items-center gap-4 text-sm text-neutral-300">
                <button onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>←</button>
                <span>{periodLabel}</span>
                <button onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>→</button>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-12">
            <PieChart
              transactions={transactions}
              currentPeriod={currentPeriod}
              previousPeriod={previousPeriod}
              onCategoryFocus={setFocusedCategory}
            />
            <LineChart transactions={transactions} currentPeriod={currentPeriod} focusedCategory={focusedCategory} />
          </section>

          <section className="mb-12 sm:mb-16">
            <div className="max-w-4xl mx-auto">
              <AdsSlot placement="belowCharts" />
            </div>
          </section>

          <section className="mb-12 sm:mb-16">
            <BudgetManager
              budgets={budgets}
              setBudgets={setBudgets}
              transactions={transactions}
              currentPeriod={currentPeriod}
              focusedCategory={focusedCategory}
            />
          </section>

          <section className="mb-12 sm:mb-16">
            <div className="max-w-4xl mx-auto">
              <AdsSlot placement="betweenSections" />
            </div>
          </section>

          <YearComparison transactions={transactions} />

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
            <TransactionForm onAddTransaction={addTransaction} />
            <TransactionList
              transactions={transactions}
              onDeleteTransaction={deleteTransaction}
              onBulkDeleteTransactions={bulkDeleteTransactions}
              onEditTransaction={editTransaction}
              onHoverCategory={setFocusedCategory}
              onDuplicateTransaction={duplicateTransaction}
            />
          </section>
        </div>

        <DebugOverlay comparisonMode={comparisonMode} currentPeriod={currentPeriod} previousPeriod={previousPeriod} transactions={transactions} />
      </div>

      <Footer />
      <ConsentBanner />
      <PrivacyPreferencesModal />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
