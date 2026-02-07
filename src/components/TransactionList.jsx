import { useEffect, useMemo, useState } from 'react'
import { useCurrency } from '../context/CurrencyContext'
import { formatSafeDate, formatSafeDateTime } from '../utils/transactions'

const CATEGORIES = [
  'Bills',
  'Credit Card',
  'Entertainment',
  'Food',
  'Housing',
  'Health',
  'Loans',
  'Transportation',
  'Utilities',
  'Shopping',
  'Income',
  'Other',
]

const PRESETS_STORAGE_KEY = 'transactionListPresets_v1'

const safeNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const toISODateInputValue = (dateLike) => {
  const d = new Date(dateLike)
  if (!Number.isFinite(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Use midday local time to reduce timezone edge cases when converting to ISO.
const toStableISOFromDateInput = (yyyyMmDd) => {
  if (!yyyyMmDd) return new Date().toISOString()
  const d = new Date(`${yyyyMmDd}T12:00:00`)
  return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString()
}

// Inclusive date check using date-only comparisons
const isWithinDateRange = (dateIso, startYYYYMMDD, endYYYYMMDD) => {
  if (!startYYYYMMDD && !endYYYYMMDD) return true
  const d = new Date(dateIso)
  if (!Number.isFinite(d.getTime())) return false

  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  dateOnly.setHours(0, 0, 0, 0)

  if (startYYYYMMDD) {
    const s = new Date(`${startYYYYMMDD}T00:00:00`)
    if (dateOnly < s) return false
  }
  if (endYYYYMMDD) {
    const e = new Date(`${endYYYYMMDD}T23:59:59`)
    if (dateOnly > e) return false
  }
  return true
}

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Newest' },
  { value: 'date_asc', label: 'Oldest' },
  { value: 'amount_desc', label: 'Amount high to low' },
  { value: 'amount_asc', label: 'Amount low to high' },
  { value: 'description_asc', label: 'Description A to Z' },
  { value: 'description_desc', label: 'Description Z to A' },
]

const readPresets = () => {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writePresets = (presets) => {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets))
  } catch {
    // ignore
  }
}

function TransactionList({
  transactions,
  onDeleteTransaction,
  onBulkDeleteTransactions, // optional, preferred for bulk actions
  onEditTransaction,
  onDuplicateTransaction, // optional; now expected to return the created transaction object
  onHoverCategory, // optional
}) {
  const { formatAmount } = useCurrency()

  const [editingId, setEditingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    category: 'Other',
    type: 'expense',
    date: '',
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [sortMode, setSortMode] = useState('date_desc')

  // Date filter (inclusive)
  const [startDate, setStartDate] = useState('') // YYYY-MM-DD
  const [endDate, setEndDate] = useState('') // YYYY-MM-DD

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Presets
  const [presets, setPresets] = useState(() => readPresets())
  const [activePresetId, setActivePresetId] = useState('')
  const [presetName, setPresetName] = useState('')

  const currentFiltersSnapshot = useMemo(() => {
    return {
      searchTerm,
      filterCategory,
      filterType,
      sortMode,
      startDate,
      endDate,
    }
  }, [searchTerm, filterCategory, filterType, sortMode, startDate, endDate])

  const applySnapshot = (snap) => {
    setSearchTerm(snap.searchTerm ?? '')
    setFilterCategory(snap.filterCategory ?? 'All')
    setFilterType(snap.filterType ?? 'All')
    setSortMode(snap.sortMode ?? 'date_desc')
    setStartDate(snap.startDate ?? '')
    setEndDate(snap.endDate ?? '')
  }

  const savePreset = () => {
    const name = presetName.trim()
    if (!name) return

    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.floor(Math.random() * 100000)}`

    const next = [
      {
        id,
        name,
        createdAt: new Date().toISOString(),
        filters: currentFiltersSnapshot,
      },
      ...presets,
    ]

    setPresets(next)
    writePresets(next)
    window.dispatchEvent(new CustomEvent('transactionListPresetsUpdated'))
    setActivePresetId(id)
    setPresetName('')
  }

  const deletePreset = (id) => {
    const next = presets.filter((p) => p.id !== id)
    setPresets(next)
    writePresets(next)
    window.dispatchEvent(new CustomEvent('transactionListPresetsUpdated'))
    if (activePresetId === id) setActivePresetId('')
  }


  const updatePreset = () => {
    if (!activePresetId) return
    const ix = presets.findIndex((p) => p.id === activePresetId)
    if (ix < 0) return

    const next = [...presets]
    next[ix] = {
      ...next[ix],
      updatedAt: new Date().toISOString(),
      filters: currentFiltersSnapshot,
    }

    setPresets(next)
    writePresets(next)
    window.dispatchEvent(new CustomEvent('transactionListPresetsUpdated'))
    // Notify same-tab listeners (storage event does not fire in same tab)
    window.dispatchEvent(new CustomEvent('transactionListPresetsUpdated'))
  }
  const loadPreset = (id) => {
    if (!id) {
      setActivePresetId('')
      return
    }
    const p = presets.find((x) => x.id === id)
    if (!p) return
    setActivePresetId(id)
    applySnapshot(p.filters || {})
  }

  const filteredTransactions = useMemo(() => {
    const s = searchTerm.trim().toLowerCase()

    const base = (transactions || []).filter((t) => {
      const desc = (t.description || '').toLowerCase()
      const matchesSearch = !s || desc.includes(s)
      const matchesCategory =
        filterCategory === 'All' || (t.category || 'Other') === filterCategory
      const matchesType = filterType === 'All' || t.type === filterType
      const matchesDate = isWithinDateRange(t.date, startDate, endDate)
      return matchesSearch && matchesCategory && matchesType && matchesDate
    })

    const sorted = [...base]
    const byDate = (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    const byAmount = (a, b) => safeNumber(a.amount) - safeNumber(b.amount)
    const byDesc = (a, b) =>
      String(a.description || '').localeCompare(String(b.description || ''), undefined, {
        sensitivity: 'base',
      })

    switch (sortMode) {
      case 'date_asc':
        sorted.sort((a, b) => byDate(a, b))
        break
      case 'date_desc':
        sorted.sort((a, b) => byDate(b, a))
        break
      case 'amount_asc':
        sorted.sort((a, b) => byAmount(a, b))
        break
      case 'amount_desc':
        sorted.sort((a, b) => byAmount(b, a))
        break
      case 'description_desc':
        sorted.sort((a, b) => byDesc(b, a))
        break
      case 'description_asc':
      default:
        sorted.sort((a, b) => byDesc(a, b))
        break
    }

    return sorted
  }, [transactions, searchTerm, filterCategory, filterType, sortMode, startDate, endDate])

  const filteredTotals = useMemo(() => {
    let income = 0
    let expenses = 0

    for (const t of filteredTransactions) {
      const amt = safeNumber(t.amount)
      if (t.type === 'income') income += amt
      else expenses += amt
    }

    return { income, expenses, net: income - expenses }
  }, [filteredTransactions])

  // Lightweight recurring merchant indicator (no schema change)
  const recurringDescriptions = useMemo(() => {
    const counts = new Map()
    for (const t of transactions || []) {
      const key = String(t.description || '').trim().toLowerCase()
      if (!key) continue
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    const recurring = new Set()
    for (const [k, c] of counts.entries()) {
      if (c >= 3) recurring.add(k)
    }
    return recurring
  }, [transactions])

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('All')
    setFilterType('All')
    setStartDate('')
    setEndDate('')
  }

  const beginEdit = (t) => {
    setEditingId(t.id)
    setExpandedId(t.id)
    setEditForm({
      description: t.description ?? '',
      amount: String(t.amount ?? ''),
      category: t.category ?? 'Other',
      type: t.type === 'income' ? 'income' : 'expense',
      date: toISODateInputValue(t.date),
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({
      description: '',
      amount: '',
      category: 'Other',
      type: 'expense',
      date: '',
    })
  }

  const saveEdit = (original) => {
    const next = {
      ...original,
      description: editForm.description,
      amount: safeNumber(editForm.amount),
      category: editForm.category || 'Other',
      type: editForm.type === 'income' ? 'income' : 'expense',
      date: toStableISOFromDateInput(editForm.date),
    }

    onEditTransaction?.(original.id, next)
    cancelEdit()
  }

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const isSelected = (id) => selectedIds.has(id)

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const t of filteredTransactions) next.add(t.id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const bulkDeleteSelected = () => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)

    if (typeof onBulkDeleteTransactions === 'function') {
      onBulkDeleteTransactions(ids)
    } else if (typeof onDeleteTransaction === 'function') {
      ids.forEach((id) => onDeleteTransaction(id))
    }

    clearSelection()
    if (expandedId && selectedIds.has(expandedId)) setExpandedId(null)
    if (editingId && selectedIds.has(editingId)) cancelEdit()
  }

  const exportFilteredCSV = () => {
    const rows = filteredTransactions.map((t) => [
      formatSafeDate(t.date),
      String(t.description || '').replaceAll(',', ' '),
      String(t.category || 'Other').replaceAll(',', ' '),
      t.type,
      safeNumber(t.amount).toFixed(2),
    ])

    const csv = [
      ['Date', 'Description', 'Category', 'Type', 'Amount'].join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_filtered_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const quickAddSimilar = (t) => {
    if (typeof onDuplicateTransaction !== 'function') return
    const created = onDuplicateTransaction(t)
    // We expect the handler to return the new transaction object
    if (created && created.id != null) {
      // Open the duplicate in edit mode immediately
      beginEdit(created)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase()
      const isTyping = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable
      if (isTyping && e.key !== 'Escape') return

      if (e.key === '?' && (e.shiftKey || !isTyping)) {
        e.preventDefault()
        setShowShortcuts(true)
        return
      }

      if (e.key === 'Escape') {
        setShowShortcuts(false)
        clearSelection()
        cancelEdit()
        setExpandedId(null)
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        selectAllFiltered()
        return
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIds.size > 0) {
        e.preventDefault()
        bulkDeleteSelected()
        return
      }

      if (!expandedId) return
      const current = (transactions || []).find((tx) => tx.id === expandedId)
      if (!current) return

      if (e.key.toLowerCase() === 'e') {
        e.preventDefault()
        beginEdit(current)
        return
      }

      if (e.key.toLowerCase() === 'd') {
        e.preventDefault()
        if (typeof onDeleteTransaction === 'function') onDeleteTransaction(current.id)
        if (expandedId === current.id) setExpandedId(null)
        if (editingId === current.id) cancelEdit()
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(current.id)
          return next
        })
        return
      }

      if (e.key.toLowerCase() === 'x') {
        e.preventDefault()
        toggleSelect(current.id)
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedId, selectedIds, filteredTransactions, transactions])

  // Keep selection valid if filters change
  useEffect(() => {
    const filteredIds = new Set(filteredTransactions.map((t) => t.id))
    setSelectedIds((prev) => {
      const next = new Set()
      for (const id of prev) {
        if (filteredIds.has(id)) next.add(id)
      }
      return next
    })
  }, [filteredTransactions])

  // Keep presets in sync across tabs and within this tab when we update localStorage.
  useEffect(() => {
    const refresh = () => {
      const next = readPresets()
      setPresets(next)
      if (activePresetId && !next.some((p) => p.id === activePresetId)) {
        setActivePresetId('')
      }
    }

    const onStorage = (e) => {
      if (e?.key !== PRESETS_STORAGE_KEY) return
      refresh()
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('transactionListPresetsUpdated', refresh)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('transactionListPresetsUpdated', refresh)
    }
  }, [activePresetId])

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-neutral-700 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-neutral-500 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-neutral-200"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-neutral-200 mb-2">No Transactions Yet</h2>
        <p className="text-neutral-400 text-center text-sm">Start by adding your first transaction</p>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-neutral-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-200 tracking-tight">Transactions</h2>
        <span className="px-3 py-1 bg-neutral-500 text-neutral-200 text-xs font-medium rounded-full">
          {transactions.length}
        </span>
      </div>

      {/* Presets */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={activePresetId}
            onChange={(e) => loadPreset(e.target.value)}
            className="px-3 py-2 bg-neutral-200 border border-neutral-200 rounded-lg text-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:border-violet-500 transition-colors"
            aria-label="Filter presets"
          >
            <option value="">Presets</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {activePresetId && (
            <button
              onClick={() => deletePreset(activePresetId)}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-900 rounded-lg text-neutral-200 text-sm font-medium transition-colors"
            >
              Delete preset
            </button>
          )}

          <div className="flex-1" />

          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Save current filters as preset"
              className="w-full sm:w-[260px] px-3 py-2 bg-neutral-200 border border-neutral-200 rounded-lg text-neutral-900 text-sm placeholder-neutral-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              onClick={savePreset}
              className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Save preset
            </button>
            <button
              onClick={updatePreset}
              disabled={!activePresetId}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activePresetId
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                  : 'bg-neutral-800/50 text-neutral-500 cursor-not-allowed'
              }`}
              title={activePresetId ? 'Overwrite selected preset with current filters' : 'Select a preset to update'}
            >
              Update preset
            </button>
          </div>
        </div>

        <div className="text-xs text-neutral-400">
          Presets store search, filters, sort, and date range in localStorage.
        </div>
      </div>

      {/* Search + Filters + Sort + Date Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <svg
            className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            aria-label="Search transactions"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-neutral-200 border border-neutral-200 rounded-xl text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <select
            aria-label="Filter by type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-neutral-200 border border-neutral-200 rounded-lg text-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:border-violet-500 transition-colors"
          >
            <option value="All">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            aria-label="Filter by category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-neutral-200 border border-neutral-200 rounded-lg text-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:border-violet-500 transition-colors"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="px-3 py-2 bg-neutral-200 border border-neutral-200 rounded-lg text-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:border-violet-500 transition-colors"
            aria-label="Sort"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>

          {/* Date filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-neutral-200 border border-neutral-200 rounded-lg px-2 py-1.5">
              <span className="text-xs text-neutral-700">From</span>
              <input
                type="date"
                aria-label="Start date filter"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-neutral-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 bg-neutral-200 border border-neutral-200 rounded-lg px-2 py-1.5">
              <span className="text-xs text-neutral-700">To</span>
              <input
                type="date"
                aria-label="End date filter"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-neutral-900 focus:outline-none"
              />
            </div>
          </div>

          {(searchTerm ||
            filterCategory !== 'All' ||
            filterType !== 'All' ||
            startDate ||
            endDate) && (
            <button
              aria-label="Clear filters"
              onClick={clearFilters}
              className="px-3 py-2 bg-neutral-200 hover:bg-neutral-400 rounded-lg text-neutral-900 text-sm font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-neutral-800 rounded-lg p-2 text-neutral-300">
            Income<br />
            <span className="text-white font-semibold tabular-nums">
              {formatAmount(filteredTotals.income)}
            </span>
          </div>
          <div className="bg-neutral-800 rounded-lg p-2 text-neutral-300">
            Expenses<br />
            <span className="text-white font-semibold tabular-nums">
              {formatAmount(filteredTotals.expenses)}
            </span>
          </div>
          <div className="bg-neutral-800 rounded-lg p-2 text-neutral-300">
            Net<br />
            <span className="text-white font-semibold tabular-nums">
              {formatAmount(filteredTotals.net)}
            </span>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-neutral-300">
            Showing <span className="text-white font-semibold">{filteredTransactions.length}</span> of{' '}
            <span className="text-white font-semibold">{transactions.length}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowShortcuts(true)}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-900 rounded-lg text-neutral-200 text-sm font-medium transition-colors"
            >
              Shortcuts
            </button>

            <button
              onClick={exportFilteredCSV}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-900 rounded-lg text-neutral-200 text-sm font-medium transition-colors"
            >
              Export filtered CSV
            </button>

            <button
              onClick={selectAllFiltered}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-900 rounded-lg text-neutral-200 text-sm font-medium transition-colors"
            >
              Select all
            </button>

            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={clearSelection}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-900 rounded-lg text-neutral-200 text-sm font-medium transition-colors"
                >
                  Clear selection ({selectedIds.size})
                </button>

                <button
                  onClick={bulkDeleteSelected}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  Delete selected
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Empty filter state */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-neutral-500 flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-neutral-200"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-neutral-200 mb-1">No Results</h3>
          <p className="text-neutral-400 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {filteredTransactions.map((t) => {
            const isEditing = editingId === t.id
            const isExpanded = expandedId === t.id
            const isIncome = t.type === 'income'
            const amountText = `${isIncome ? '+' : '-'}${formatAmount(safeNumber(t.amount))}`
            const recurring =
              recurringDescriptions.has(String(t.description || '').trim().toLowerCase())

            return (
              <div
                key={t.id}
                className="bg-neutral-200 rounded-xl transition-all duration-200"
                onMouseEnter={() => onHoverCategory?.(t.category || null)}
                onMouseLeave={() => onHoverCategory?.(null)}
              >
                <div className="flex items-start gap-3 p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(t.id)}
                    onChange={() => toggleSelect(t.id)}
                    className="mt-1.5 h-4 w-4 accent-violet-600"
                    aria-label="Select transaction"
                  />

                  <button
                    type="button"
                    onClick={() => toggleExpand(t.id)}
                    className="flex-1 text-left"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-black truncate">{t.description}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-neutral-300 text-neutral-800 rounded-full">
                            {t.category || 'Other'}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-neutral-300 text-neutral-800 rounded-full">
                            {t.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                          {recurring && (
                            <span className="text-xs px-2 py-0.5 bg-violet-200 text-violet-900 rounded-full">
                              Recurring
                            </span>
                          )}
                          <span className="text-xs text-neutral-500">
                            {formatSafeDate(t.date, 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold tabular-nums ${
                            isIncome ? 'text-black' : 'text-neutral-700'
                          }`}
                        >
                          {amountText}
                        </span>

                        <span className="text-neutral-600">
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    {isEditing ? (
                      <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, description: e.target.value }))
                            }
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-black text-sm focus:outline-none focus:border-violet-500"
                            placeholder="Description"
                          />

                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-black text-sm focus:outline-none focus:border-violet-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="number"
                            value={editForm.amount}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, amount: e.target.value }))
                            }
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-black text-sm focus:outline-none focus:border-violet-500"
                            placeholder="Amount"
                            step="0.01"
                          />

                          <select
                            value={editForm.type}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, type: e.target.value }))
                            }
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-black text-sm focus:outline-none focus:border-violet-500"
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>

                          <select
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, category: e.target.value }))
                            }
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-black text-sm focus:outline-none focus:border-violet-500"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(t)}
                            className="flex-1 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 py-2 bg-neutral-200 text-black text-sm font-medium rounded-lg hover:bg-neutral-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-neutral-50 rounded-xl p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-neutral-500 text-xs">Description</div>
                            <div className="text-neutral-900 break-words">{t.description || ''}</div>
                          </div>
                          <div>
                            <div className="text-neutral-500 text-xs">Date</div>
                            <div className="text-neutral-900">
                              {formatSafeDateTime(t.date, 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                          <div>
                            <div className="text-neutral-500 text-xs">Category</div>
                            <div className="text-neutral-900">{t.category || 'Other'}</div>
                          </div>
                          <div>
                            <div className="text-neutral-500 text-xs">Type</div>
                            <div className="text-neutral-900">
                              {t.type === 'income' ? 'Income' : 'Expense'}
                            </div>
                          </div>
                          <div>
                            <div className="text-neutral-500 text-xs">Amount</div>
                            <div className="text-neutral-900 font-semibold tabular-nums">
                              {amountText}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          {typeof onDuplicateTransaction === 'function' && (
                            <>
                              <button
                                onClick={() => onDuplicateTransaction(t)}
                                className="px-3 py-2 bg-neutral-200 hover:bg-neutral-300 rounded-lg text-neutral-900 text-sm font-medium transition-colors"
                              >
                                Duplicate
                              </button>

                              <button
                                onClick={() => quickAddSimilar(t)}
                                className="px-3 py-2 bg-neutral-200 hover:bg-neutral-300 rounded-lg text-neutral-900 text-sm font-medium transition-colors"
                              >
                                Quick add similar
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => beginEdit(t)}
                            className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => onDeleteTransaction?.(t.id)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>

                        <div className="mt-3 text-xs text-neutral-500">
                          Keyboard shortcuts: E to edit, D to delete, X to select, Delete to bulk delete, Ctrl or Cmd plus A to select all, Escape to clear, question mark for help
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Keyboard shortcuts</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-neutral-400 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-neutral-300 space-y-2">
              <div className="flex justify-between">
                <span>Open this panel</span>
                <span className="text-white font-medium">Shift + ?</span>
              </div>
              <div className="flex justify-between">
                <span>Select all filtered</span>
                <span className="text-white font-medium">Ctrl or Cmd + A</span>
              </div>
              <div className="flex justify-between">
                <span>Bulk delete selected</span>
                <span className="text-white font-medium">Delete</span>
              </div>
              <div className="flex justify-between">
                <span>Edit expanded row</span>
                <span className="text-white font-medium">E</span>
              </div>
              <div className="flex justify-between">
                <span>Delete expanded row</span>
                <span className="text-white font-medium">D</span>
              </div>
              <div className="flex justify-between">
                <span>Select expanded row</span>
                <span className="text-white font-medium">X</span>
              </div>
              <div className="flex justify-between">
                <span>Clear selection and close panels</span>
                <span className="text-white font-medium">Escape</span>
              </div>
            </div>

            <div className="mt-5 text-xs text-neutral-500">
              Shortcuts are disabled while typing in inputs except Escape.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionList
