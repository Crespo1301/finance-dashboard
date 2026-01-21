import { useState } from 'react'
import { useCurrency } from '../context/CurrencyContext'

const EXPENSE_CATEGORIES = [
  'Entertainment',
  'Food',
  'Housing',
  'Health',
  'Transportation',
  'Utilities',
  'Shopping',
  'Other'
]

function BudgetManager({ budgets, setBudgets, transactions }) {
  const { formatAmount, getSymbol } = useCurrency()
  const [selectedCategory, setSelectedCategory] = useState('Food')
  const [budgetAmount, setBudgetAmount] = useState('')

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const monthlySpending = transactions
    .filter(t => {
      const date = new Date(t.date)
      return t.type === 'expense' && 
             date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  const handleSetBudget = (e) => {
    e.preventDefault()
    if (!budgetAmount) return
    
    setBudgets({
      ...budgets,
      [selectedCategory]: parseFloat(budgetAmount)
    })
    setBudgetAmount('')
  }

  const handleRemoveBudget = (category) => {
    const newBudgets = { ...budgets }
    delete newBudgets[category]
    setBudgets(newBudgets)
  }

  const getProgressColor = (spent, budget) => {
    const percentage = (spent / budget) * 100
    if (percentage >= 100) return 'bg-black'
    if (percentage >= 80) return 'bg-neutral-600'
    return 'bg-violet-600'
  }

  const getStatusInfo = (spent, budget) => {
    const percentage = (spent / budget) * 100
    if (percentage >= 100) return { text: 'Over budget', textColor: 'text-black' }
    if (percentage >= 80) return { text: 'Almost at limit', textColor: 'text-neutral-600' }
    return { text: 'On track', textColor: 'text-violet-600' }
  }

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-neutral-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-neutral-200 tracking-tight">Budget Goals</h2>
        <span className="text-sm text-neutral-500 px-3 py-1 bg-neutral-200 rounded-full border border-neutral-200">
          {currentMonthName}
        </span>
      </div>
      
      {/* Add Budget Form */}
      <form onSubmit={handleSetBudget} className="mb-8 p-4 bg-neutral-800 rounded-xl border border-neutral-900">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-200 border border-neutral-200 rounded-lg text-black text-sm appearance-none cursor-pointer focus:outline-none focus:border-violet-500 transition-colors"
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">{getSymbol()}</span>
            <input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="Monthly limit"
              className="w-full pl-8 pr-4 py-2.5 bg-neutral-200 border border-neutral-200 rounded-lg text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-violet-500 transition-colors"
              step="0.01"
              min="0"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Set Budget
          </button>
        </div>
      </form>

      {/* Budget List */}
      <div className="space-y-3">
        {Object.keys(budgets).length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
            </div>
            <p className="text-neutral-500 text-sm">No budgets set yet</p>
          </div>
        ) : (
          Object.entries(budgets).map(([category, budget]) => {
            const spent = monthlySpending[category] || 0
            const percentage = Math.min((spent / budget) * 100, 100)
            const status = getStatusInfo(spent, budget)
            
            return (
              <div key={category} className="p-4 bg-neutral-800 rounded-xl border border-neutral-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-neutral-200">{category}</h3>
                    <p className="text-sm text-neutral-500">
                      {formatAmount(spent)} of {formatAmount(budget)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${status.textColor}`}>
                      {status.text}
                    </span>
                    <button
                      onClick={() => handleRemoveBudget(category)}
                      className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
                      aria-label="Remove budget"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(spent, budget)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2 text-right">
                  {percentage.toFixed(0)}% used
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default BudgetManager