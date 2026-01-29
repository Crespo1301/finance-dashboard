import { useMemo, useState } from 'react'
import { useCurrency } from '../context/CurrencyContext'

const CATEGORIES = [
  'Credit Card',
  'Bills',
  'Entertainment',
  'Food',
  'Housing',
  'Health',
  "Loans",
  'Transportation',
  'Utilities',
  'Shopping',
  'Income',
  'Other'
]

function BudgetManager({ budgets, setBudgets, transactions }) {
  const { formatAmount, getSymbol } = useCurrency()
  const [category, setCategory] = useState('Food')
  const [amount, setAmount] = useState('')
  const [monthOffset, setMonthOffset] = useState(0)

  const targetDate = new Date()
  targetDate.setMonth(targetDate.getMonth() - monthOffset)

  const monthLabel = targetDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const spending = useMemo(() => {
    return transactions
      .filter(t => {
        if (t.type !== 'expense') return false
        const d = new Date(t.date)
        return (
          d.getMonth() === targetDate.getMonth() &&
          d.getFullYear() === targetDate.getFullYear()
        )
      })
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {})
  }, [transactions, monthOffset])

  const setBudget = () => {
    if (!amount) return
    setBudgets({
      ...budgets,
      [category]: Number(amount),
    })
    setAmount('')
  }

  return (
    <div className="p-6 rounded-2xl bg-neutral-800 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">
          Budgets
        </h2>
        <span className="text-xs text-neutral-400">{monthLabel}</span>
      </div>

      {/* Month Nav */}
      <div className="flex justify-between text-xs text-neutral-400">
        <button onClick={() => setMonthOffset(o => o + 1)}>← Previous</button>
        <button onClick={() => setMonthOffset(o => Math.max(o - 1, 0))}>
          Next →
        </button>
      </div>

      {/* Add */}
      <div className="flex gap-2">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="flex-1 bg-neutral-700 text-white px-3 py-2 rounded"
        >
          {CATEGORIES.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder={`${getSymbol()}0`}
          className="w-28 bg-neutral-700 text-white px-3 py-2 rounded"
        />

        <button
          onClick={setBudget}
          className="px-4 py-2 bg-violet-600 rounded text-white"
        >
          Set
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {Object.entries(budgets).map(([cat, limit]) => {
          const spent = spending[cat] || 0
          const pct = Math.min((spent / limit) * 100, 100)

          return (
            <div key={cat} className="bg-neutral-900 p-4 rounded-xl">
              <div className="flex justify-between text-sm">
                <span className="text-white">{cat}</span>
                <span className="text-neutral-400">
                  {formatAmount(spent)} / {formatAmount(limit)}
                </span>
              </div>

              <div className="h-2 bg-neutral-700 rounded mt-2">
                <div
                  className={`h-full rounded ${
                    pct >= 100
                      ? 'bg-red-500'
                      : pct >= 80
                      ? 'bg-yellow-400'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BudgetManager
