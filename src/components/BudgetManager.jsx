import { useMemo, useState } from 'react'
import { useCurrency } from '../context/CurrencyContext'
import { normalizeTransactions, safeCategory, safeDate, safeNumber } from '../utils/transactions'

/* -------------------------------------------- */
/* Helpers */
/* -------------------------------------------- */
const monthKeyFromPeriod = (period) => {
  if (!period?.start) return null
  const d = period.start
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const isPastPeriod = (period) => {
  if (!period?.end) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return period.end < today
}

const DEFAULT_CATEGORIES = [
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
  'Other',
]

/* -------------------------------------------- */
/* Component */
/* -------------------------------------------- */
function BudgetManager({
  budgets,
  setBudgets,
  transactions,
  currentPeriod,
  focusedCategory,
}) {
  const { formatAmount, getSymbol } = useCurrency()

  if (!currentPeriod?.start || !currentPeriod?.end) {
    return (
      <div className="p-6 rounded-2xl bg-neutral-800 text-sm text-neutral-400">
        Select a month or year comparison to manage budgets.
      </div>
    )
  }

  const monthKey = monthKeyFromPeriod(currentPeriod)
  const monthBudgets = budgets?.[monthKey] || {}
  const locked = isPastPeriod(currentPeriod)

  const [newCategory, setNewCategory] = useState(DEFAULT_CATEGORIES[0])
  const [newLimit, setNewLimit] = useState('')

  const safeTransactions = useMemo(() => normalizeTransactions(transactions), [transactions])

  const expenses = useMemo(() => {
    return safeTransactions.filter((t) => {
      if (t.type !== 'expense') return false
      const d = safeDate(t.date)
      if (!d) return false
      return d >= currentPeriod.start && d <= currentPeriod.end
    })
  }, [safeTransactions, currentPeriod])

  const spentByCategory = useMemo(() => {
    return expenses.reduce((acc, t) => {
      const cat = safeCategory(t.category)
      acc[cat] = (acc[cat] || 0) + safeNumber(t.amount)
      return acc
    }, {})
  }, [expenses])

  const today = new Date()
  const monthStart = currentPeriod.start
  const totalDays = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0
  ).getDate()
  const daysElapsed = today < monthStart ? 0 : Math.min(today.getDate(), totalDays)

  const setBudget = () => {
    if (locked) return
    const val = Number(newLimit)
    if (!newCategory || !val || val <= 0) return

    setBudgets((prev) => ({
      ...(prev || {}),
      [monthKey]: {
        ...((prev && prev[monthKey]) || {}),
        [newCategory]: val,
      },
    }))

    setNewLimit('')
  }

  const updateBudget = (category, value) => {
    if (locked) return
    setBudgets((prev) => ({
      ...(prev || {}),
      [monthKey]: {
        ...((prev && prev[monthKey]) || {}),
        [category]: Number(value),
      },
    }))
  }

  const removeBudget = (category) => {
    if (locked) return
    setBudgets((prev) => {
      const nextMonth = { ...((prev && prev[monthKey]) || {}) }
      delete nextMonth[category]
      return { ...(prev || {}), [monthKey]: nextMonth }
    })
  }

  const copyLastMonth = () => {
    if (locked) return
    const d = currentPeriod.start
    const prevKey = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    const prevBudgets = budgets?.[prevKey]
    if (!prevBudgets || Object.keys(prevBudgets).length === 0) return
    if (Object.keys(monthBudgets).length > 0) return

    setBudgets((prev) => ({
      ...(prev || {}),
      [monthKey]: { ...prevBudgets },
    }))
  }

  const categoriesForDropdown = useMemo(() => {
    const fromTx = Array.from(new Set(expenses.map((t) => t.category || 'Other')))
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...fromTx])).sort()
  }, [expenses])

  return (
    <div className="p-6 rounded-2xl bg-neutral-800 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-200">Monthly Budgets</h2>

        {!locked && Object.keys(monthBudgets).length === 0 && (
          <button
            onClick={copyLastMonth}
            className="text-xs text-violet-400 hover:text-violet-300"
          >
            Copy Last Month
          </button>
        )}
      </div>

      <div className="bg-neutral-900 rounded-xl p-4 space-y-3">
        <div className="text-sm text-neutral-200 font-medium">
          Set a budget for this month
        </div>

        {locked ? (
          <div className="text-xs text-neutral-500">
            Budgets are locked for past months.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm"
            >
              {categoriesForDropdown.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              placeholder={`${getSymbol?.() ?? '$'}0`}
              className="w-full sm:w-40 bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm"
            />

            <button
              onClick={setBudget}
              className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition"
            >
              Set Budget
            </button>
          </div>
        )}
      </div>

      {Object.keys(monthBudgets).length === 0 ? (
        <div className="text-sm text-neutral-500">No budgets set for this month</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(monthBudgets).map(([category, limit]) => {
            const spent = spentByCategory[category] || 0
            const remaining = limit - spent

            const dailyRate = daysElapsed > 0 ? spent / daysElapsed : 0
            const projected = dailyRate * totalDays

            let status = 'under'
            if (remaining === 0) status = 'met'
            if (remaining < 0) status = 'over'

            const pct = Math.min((spent / limit) * 100, 100)

            return (
              <div
                key={category}
                className={`p-4 rounded-lg bg-neutral-900 ${
                  focusedCategory === category ? 'ring-2 ring-violet-500' : ''
                }`}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-200">{category}</span>
                  <span className="text-neutral-300">
                    {formatAmount(spent)} / {formatAmount(limit)}
                  </span>
                </div>

                <div className="h-2 bg-neutral-700 rounded">
                  <div
                    className={`h-2 rounded ${
                      status === 'over'
                        ? 'bg-red-500'
                        : status === 'met'
                        ? 'bg-yellow-400'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="text-xs mt-2 text-neutral-400">
                  {status === 'met' && 'Budget met — do not go over'}
                  {status === 'under' && `Remaining: ${formatAmount(remaining)}`}
                  {status === 'over' && `Over by ${formatAmount(Math.abs(remaining))}`}
                </div>

                <div className="text-xs text-neutral-500 mt-1">
                  Forecast end-of-month: {formatAmount(projected)}
                </div>

                {!locked && (
                  <div className="flex gap-2 mt-3">
                    <input
                      type="number"
                      value={limit}
                      onChange={(e) => updateBudget(category, e.target.value)}
                      className="flex-1 bg-neutral-800 rounded px-2 py-1 text-sm text-white"
                    />
                    <button
                      onClick={() => removeBudget(category)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BudgetManager
