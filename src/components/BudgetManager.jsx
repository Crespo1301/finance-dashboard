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
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getAlertStatus = (spent, budget) => {
    const percentage = (spent / budget) * 100
    if (percentage >= 100) return { text: 'Over Budget!', color: 'text-red-600', icon: '🚨' }
    if (percentage >= 80) return { text: 'Almost at limit', color: 'text-yellow-600', icon: '⚠️' }
    return { text: 'On track', color: 'text-green-600', icon: '✅' }
  }

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Budget Goals</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {currentMonthName}
        </span>
      </div>
      
      <form onSubmit={handleSetBudget} className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-gray-800"
          >
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{getSymbol()}</span>
            <input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="Monthly limit"
              className="w-full pl-8 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-gray-800 placeholder-gray-400"
              step="0.01"
              min="0"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Set Budget
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {Object.keys(budgets).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-gray-500">No budgets set yet. Add one above!</p>
          </div>
        ) : (
          Object.entries(budgets).map(([category, budget]) => {
            const spent = monthlySpending[category] || 0
            const percentage = Math.min((spent / budget) * 100, 100)
            const alert = getAlertStatus(spent, budget)
            
            return (
              <div key={category} className="p-4 border-2 border-gray-100 rounded-lg bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{category}</h3>
                    <p className="text-sm text-gray-500">
                      {formatAmount(spent)} of {formatAmount(budget)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${alert.color}`}>
                      {alert.icon} {alert.text}
                    </span>
                    <button
                      onClick={() => handleRemoveBudget(category)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(spent, budget)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
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