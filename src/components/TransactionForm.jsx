import { useEffect, useMemo, useState } from 'react'
import { useCurrency } from '../context/CurrencyContext'

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

const todayISO = () => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const parseISODateLocal = (iso) => {
  // Parse YYYY-MM-DD from <input type="date"> as a LOCAL date (avoids UTC shifting to the prior day)
  if (typeof iso !== 'string') return null
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const y = Number(match[1])
  const mo = Number(match[2])
  const da = Number(match[3])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(da)) return null
  // Use noon local time to avoid DST edge cases
  const dt = new Date(y, mo - 1, da, 12, 0, 0, 0)
  return Number.isFinite(dt.getTime()) ? dt : null
}

const safeNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

const makeId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    // ignore
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const addMonthsKeepDay = (date, months) => {
  // Moves forward by months while keeping day when possible.
  const d = new Date(date)
  const day = d.getDate()
  const targetMonth = d.getMonth() + months
  const targetYear = d.getFullYear() + Math.floor(targetMonth / 12)
  const monthIndex = ((targetMonth % 12) + 12) % 12
  const lastDay = new Date(targetYear, monthIndex + 1, 0).getDate()
  const finalDay = Math.min(day, lastDay)
  return new Date(targetYear, monthIndex, finalDay, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds())
}

const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const computeOccurrences = (startDateISO, frequency, count) => {
  const base = parseISODateLocal(startDateISO) || new Date(startDateISO)
  if (Number.isNaN(base.getTime())) return []

  const n = Math.max(1, Math.min(200, Number(count) || 1)) // safety cap
  const out = []

  for (let i = 0; i < n; i++) {
    let d = base
    if (i === 0) {
      d = base
    } else {
      if (frequency === 'weekly') d = addDays(base, i * 7)
      if (frequency === 'biweekly') d = addDays(base, i * 14)
      if (frequency === 'monthly') d = addMonthsKeepDay(base, i)
    }
    out.push(d)
  }

  return out
}

const clampCents = (n) => Math.round(n * 100) / 100

function TransactionForm({ onAddTransaction }) {
  const { formatAmount } = useCurrency()

  const [type, setType] = useState(() => localStorage.getItem('last_tx_type') || 'expense')
  const [category, setCategory] = useState(() => {
    const saved = localStorage.getItem('last_tx_category')
    if (saved) return saved
    return type === 'income' ? 'Income' : 'Other'
  })

  const [date, setDate] = useState(todayISO)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  // Receipt placeholder (metadata only)
  const [receiptMeta, setReceiptMeta] = useState(null)

  // Split mode
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [splits, setSplits] = useState(() => [
    { id: makeId(), category: 'Other', amount: '' },
  ])

  // Recurring mode
  const [recurringEnabled, setRecurringEnabled] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState('monthly') // weekly | biweekly | monthly
  const [recurringCount, setRecurringCount] = useState(3)

  const [touched, setTouched] = useState(false)

  useEffect(() => {
    localStorage.setItem('last_tx_type', type)
  }, [type])

  useEffect(() => {
    localStorage.setItem('last_tx_category', category)
  }, [category])

  useEffect(() => {
    // Keep category sensible when type toggles
    if (type === 'income' && category !== 'Income') setCategory('Income')
    if (type === 'expense' && category === 'Income') setCategory('Other')

    // Also fix split categories if switching to income
    if (type === 'income' && splitEnabled) {
      setSplits((prev) => prev.map((s) => ({ ...s, category: 'Income' })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const parsedAmount = useMemo(() => safeNumber(amount), [amount])

  const parsedSplits = useMemo(() => {
    return splits.map((s) => ({
      ...s,
      parsed: safeNumber(s.amount),
    }))
  }, [splits])

  const splitsSum = useMemo(() => {
    const sum = parsedSplits.reduce((acc, s) => (Number.isFinite(s.parsed) ? acc + s.parsed : acc), 0)
    return clampCents(sum)
  }, [parsedSplits])

  const splitHasInvalid = useMemo(() => {
    return parsedSplits.some((s) => !s.category || !Number.isFinite(s.parsed) || s.parsed <= 0)
  }, [parsedSplits])

  const splitMatchesTotal = useMemo(() => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return false
    // Require exact cents match
    return clampCents(parsedAmount) === clampCents(splitsSum)
  }, [parsedAmount, splitsSum])

  const occurrences = useMemo(() => {
    if (!recurringEnabled) return [new Date(date)]
    if (recurringFrequency === 'weekly' || recurringFrequency === 'biweekly' || recurringFrequency === 'monthly') {
      return computeOccurrences(date, recurringFrequency, recurringCount)
    }
    return [new Date(date)]
  }, [recurringEnabled, recurringFrequency, recurringCount, date])

  const totalTransactionsToCreate = useMemo(() => {
    const perOccurrence = splitEnabled ? splits.length : 1
    return occurrences.length * perOccurrence
  }, [occurrences.length, splitEnabled, splits.length])

  const projectedTotalAmount = useMemo(() => {
    // Total across all generated transactions
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return 0
    if (!splitEnabled) return clampCents(parsedAmount * occurrences.length)
    // If split enabled, amount is total per occurrence, so multiply by occurrences
    return clampCents(parsedAmount * occurrences.length)
  }, [parsedAmount, splitEnabled, occurrences.length])

  const errors = useMemo(() => {
    const list = []
    const d = new Date(date)

    if (!date || Number.isNaN(d.getTime())) list.push('Choose a valid date.')
    if (!description.trim()) list.push('Enter a description.')

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) list.push('Enter a valid amount greater than zero.')

    if (!splitEnabled) {
      if (!category) list.push('Choose a category.')
    } else {
      if (splits.length < 2) list.push('Add at least two split lines or disable split mode.')
      if (splitHasInvalid) list.push('Each split line needs a category and a valid amount greater than zero.')
      if (!splitMatchesTotal) list.push('Split amounts must match the total amount exactly.')
    }

    if (recurringEnabled) {
      const n = Number(recurringCount)
      if (!Number.isFinite(n) || n < 1) list.push('Recurring count must be at least 1.')
      if (n > 200) list.push('Recurring count is capped at 200 for safety.')
      if (!['weekly', 'biweekly', 'monthly'].includes(recurringFrequency)) list.push('Choose a valid recurring frequency.')
    }

    if (totalTransactionsToCreate > 200) list.push('Too many transactions would be created. Reduce recurring count or split lines.')

    return list
  }, [
    date,
    description,
    parsedAmount,
    category,
    splitEnabled,
    splits.length,
    splitHasInvalid,
    splitMatchesTotal,
    recurringEnabled,
    recurringCount,
    recurringFrequency,
    totalTransactionsToCreate,
  ])

  const canSubmit = errors.length === 0

  const reset = () => {
    setDate(todayISO())
    setDescription('')
    setAmount('')
    setNotes('')
    setReceiptMeta(null)
    setTouched(false)

    // Keep recurring and split toggles as-is; these are user preferences.
  }

  const buildReceiptMeta = (file) => {
    if (!file) return null
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    }
  }

  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return

    const groupId = splitEnabled ? makeId() : null
    const baseNotes = notes.trim() || undefined
    const receipt = receiptMeta || undefined

    const desc = description.trim()
    const baseAmount = clampCents(Number(parsedAmount.toFixed(2)))

    const createOne = ({ txDate, txCategory, txAmount, splitLabel }) => {
      const tx = {
        id: makeId(),
        date: txDate.toISOString(),
        description: splitLabel ? `${desc} (${splitLabel})` : desc,
        category: txCategory,
        type,
        amount: clampCents(Number(txAmount.toFixed(2))),
        notes: baseNotes,
        receipt,
        groupId: groupId || undefined,
      }
      onAddTransaction?.(tx)
    }

    // For each occurrence, add either one tx or split txs
    occurrences.forEach((occDate) => {
      if (!splitEnabled) {
        createOne({ txDate: occDate, txCategory: category, txAmount: baseAmount, splitLabel: null })
        return
      }

      parsedSplits.forEach((s) => {
        const label = s.category || 'Split'
        createOne({
          txDate: occDate,
          txCategory: s.category,
          txAmount: clampCents(s.parsed),
          splitLabel: label,
        })
      })
    })

    reset()
  }

  const setSplitLine = (id, patch) => {
    setSplits((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const addSplitLine = () => {
    setSplits((prev) => [...prev, { id: makeId(), category: type === 'income' ? 'Income' : 'Other', amount: '' }])
  }

  const removeSplitLine = (id) => {
    setSplits((prev) => prev.filter((s) => s.id !== id))
  }

  const enableSplit = (next) => {
    setSplitEnabled(next)
    if (next) {
      // Ensure there are at least 2 lines
      setSplits((prev) => {
        const normalized = prev.length ? prev : [{ id: makeId(), category: type === 'income' ? 'Income' : 'Other', amount: '' }]
        if (normalized.length >= 2) return normalized
        return [...normalized, { id: makeId(), category: type === 'income' ? 'Income' : 'Other', amount: '' }]
      })
    }
  }

  const enableRecurring = (next) => {
    setRecurringEnabled(next)
    if (next) {
      setRecurringFrequency((f) => f || 'monthly')
      setRecurringCount((c) => (Number.isFinite(Number(c)) && Number(c) > 0 ? c : 3))
    }
  }

  const previewLines = useMemo(() => {
    // Build a lightweight preview list for UX, capped
    const maxLines = 10
    const lines = []

    const occDates = occurrences.slice(0, maxLines)
    occDates.forEach((d, occIdx) => {
      if (!splitEnabled) {
        lines.push({
          key: `${occIdx}-single`,
          date: d,
          category,
          amount: Number.isFinite(parsedAmount) ? clampCents(parsedAmount) : null,
        })
        return
      }

      parsedSplits.slice(0, 3).forEach((s, splitIdx) => {
        lines.push({
          key: `${occIdx}-split-${splitIdx}`,
          date: d,
          category: s.category,
          amount: Number.isFinite(s.parsed) ? clampCents(s.parsed) : null,
        })
      })

      if (parsedSplits.length > 3) {
        lines.push({
          key: `${occIdx}-more`,
          date: null,
          category: `${parsedSplits.length - 3} more split lines`,
          amount: null,
        })
      }
    })

    return lines
  }, [occurrences, splitEnabled, parsedSplits, category, parsedAmount])

  return (
    <form onSubmit={submit} className="p-6 sm:p-8 rounded-2xl bg-neutral-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-200 tracking-tight">Add Transaction</h2>
        <div className="bg-neutral-800 rounded-full p-1 flex gap-1 text-sm">
          {[
            { label: 'Expense', value: 'expense' },
            { label: 'Income', value: 'income' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                type === opt.value ? 'bg-white text-black' : 'text-neutral-300 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-xs text-neutral-300">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 bg-neutral-200 border border-neutral-200 rounded-xl text-black text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-300">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Rent, groceries, paycheck"
            className="mt-1 w-full px-3 py-2.5 bg-neutral-200 border border-neutral-200 rounded-xl text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-neutral-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={splitEnabled}
              className={`mt-1 w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors ${
                splitEnabled
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-800'
                  : 'bg-neutral-200 border border-neutral-200 text-black focus:border-violet-500'
              }`}
            >
              {CATEGORIES.filter((c) => (type === 'income' ? c === 'Income' : c !== 'Income')).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {splitEnabled && <div className="text-xs text-neutral-500 mt-1">Category is managed per split line</div>}
          </div>

          <div>
            <label className="text-xs text-neutral-300">Total amount</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="0.00"
              className="mt-1 w-full px-3 py-2.5 bg-neutral-200 border border-neutral-200 rounded-xl text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <div className="text-xs text-neutral-400 mt-1">
              Preview {Number.isFinite(parsedAmount) ? formatAmount(parsedAmount) : formatAmount(0)}
            </div>
          </div>
        </div>

        <div className="bg-neutral-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-neutral-200">Advanced options</div>
              <div className="text-xs text-neutral-400 mt-1">Split transactions, recurring schedules, and receipt metadata</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => enableSplit(!splitEnabled)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  splitEnabled ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-300 hover:text-white'
                }`}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => enableRecurring(!recurringEnabled)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  recurringEnabled ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-300 hover:text-white'
                }`}
              >
                Recurring
              </button>
            </div>
          </div>

          {splitEnabled && (
            <div className="mt-4">
              <div className="text-xs text-neutral-400 mb-2">Split lines must sum exactly to the total amount</div>

              <div className="space-y-2">
                {splits.map((s) => (
                  <div key={s.id} className="grid grid-cols-1 sm:grid-cols-[1fr_160px_90px] gap-2">
                    <select
                      value={s.category}
                      onChange={(e) => setSplitLine(s.id, { category: e.target.value })}
                      className="px-3 py-2 bg-neutral-900 border border-neutral-900 rounded-xl text-neutral-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    >
                      {CATEGORIES.filter((c) => (type === 'income' ? c === 'Income' : c !== 'Income')).map((cat) => (
                        <option key={`${s.id}-${cat}`} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={s.amount}
                      onChange={(e) => setSplitLine(s.id, { amount: e.target.value })}
                      className="px-3 py-2 bg-neutral-900 border border-neutral-900 rounded-xl text-neutral-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                      placeholder="0.00"
                    />

                    <button
                      type="button"
                      onClick={() => removeSplitLine(s.id)}
                      disabled={splits.length <= 2}
                      className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                        splits.length <= 2
                          ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                          : 'bg-neutral-900 text-red-300 hover:text-red-200'
                      }`}
                      title={splits.length <= 2 ? 'Keep at least two split lines' : 'Remove split line'}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                <button
                  type="button"
                  onClick={addSplitLine}
                  className="px-3 py-2 rounded-lg text-sm bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
                >
                  Add split line
                </button>

                <div className="text-sm text-neutral-300 tabular-nums">
                  Sum {formatAmount(splitsSum)}{' '}
                  <span className={splitMatchesTotal ? 'text-green-400' : 'text-yellow-300'}>
                    {splitMatchesTotal ? 'matches total' : 'does not match total'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {recurringEnabled && (
            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400">Frequency</label>
                  <select
                    value={recurringFrequency}
                    onChange={(e) => setRecurringFrequency(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-neutral-900 border border-neutral-900 rounded-xl text-neutral-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-400">Occurrences</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={recurringCount}
                    onChange={(e) => setRecurringCount(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-neutral-900 border border-neutral-900 rounded-xl text-neutral-200 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <div className="text-xs text-neutral-500 mt-1">Max 200 for safety</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="text-xs text-neutral-400">Receipt (metadata only)</label>
            <div className="mt-1 flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setReceiptMeta(buildReceiptMeta(file))
                }}
                className="block w-full text-sm text-neutral-300
                  file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0
                  file:bg-neutral-900 file:text-neutral-200 hover:file:text-white"
              />
              {receiptMeta && (
                <button
                  type="button"
                  onClick={() => setReceiptMeta(null)}
                  className="px-3 py-2 rounded-lg text-sm bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {receiptMeta && (
              <div className="text-xs text-neutral-500 mt-2">
                Attached {receiptMeta.name} ({Math.round(receiptMeta.size / 1024)} KB)
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-300">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Anything you want to remember about this transaction"
            className="mt-1 w-full px-3 py-2.5 bg-neutral-200 border border-neutral-200 rounded-xl text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-violet-500 transition-colors resize-none"
          />
        </div>

        <div className="bg-neutral-800 rounded-2xl p-4">
          <div className="text-sm font-semibold text-neutral-200">Preview</div>
          <div className="text-xs text-neutral-400 mt-1">
            This will create {totalTransactionsToCreate} transaction{totalTransactionsToCreate === 1 ? '' : 's'} totaling {formatAmount(projectedTotalAmount)}
          </div>

          <div className="mt-3 space-y-2">
            {previewLines.map((p) => (
              <div key={p.key} className="flex items-center justify-between text-sm bg-neutral-900 rounded-xl px-3 py-2">
                <div className="text-neutral-200">
                  {p.date ? p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                  <span className="text-neutral-500 ml-2">{p.category}</span>
                </div>
                <div className="text-neutral-200 tabular-nums">{p.amount == null ? '' : formatAmount(p.amount)}</div>
              </div>
            ))}

            {totalTransactionsToCreate > previewLines.length && (
              <div className="text-xs text-neutral-500">
                Preview shows the first entries only
              </div>
            )}
          </div>
        </div>

        {touched && errors.length > 0 && (
          <div className="bg-neutral-800 rounded-xl p-3 text-sm text-neutral-200">
            <div className="text-xs text-neutral-400 mb-1">Fix the following</div>
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              canSubmit ? 'bg-white text-black hover:bg-neutral-200' : 'bg-neutral-900 text-neutral-500 cursor-not-allowed'
            }`}
          >
            Add transaction{totalTransactionsToCreate > 1 ? 's' : ''}
          </button>

          <button
            type="button"
            onClick={reset}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-neutral-900 text-neutral-200 hover:bg-neutral-600 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </form>
  )
}

export default TransactionForm
