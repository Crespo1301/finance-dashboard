import { useState } from 'react'

const CATEGORIES = [
  'Food',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Income',
  'Other'
]

function TransactionForm({ onAddTransaction }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState('Other')
  const [type, setType] = useState('expense')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!description || !amount) return

    const transaction = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      category,
      type,
      date: new Date(date).toISOString() // Changed this line
    }

    onAddTransaction(transaction)
    
    // Reset form
    setDescription('')
    setAmount('')
    setDate(new Date().toISOString().split('T')[0])
    setCategory('Other')
    setType('expense')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Transaction</h2>
      
      {/* Type Toggle */}
      <div className="flex gap-3 mb-6">
        <label className={`flex-1 flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all ${
          type === 'expense' 
            ? 'bg-red-50 border-2 border-red-500 text-red-700' 
            : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:border-gray-300'
        }`}>
          <input
            type="radio"
            name="type"
            value="expense"
            checked={type === 'expense'}
            onChange={(e) => setType(e.target.value)}
            className="sr-only"
          />
          <span className="font-medium">💸 Expense</span>
        </label>
        <label className={`flex-1 flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all ${
          type === 'income' 
            ? 'bg-green-50 border-2 border-green-500 text-green-700' 
            : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:border-gray-300'
        }`}>
          <input
            type="radio"
            name="type"
            value="income"
            checked={type === 'income'}
            onChange={(e) => setType(e.target.value)}
            className="sr-only"
          />
          <span className="font-medium">💰 Income</span>
        </label>
      </div>

      {/* Description */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="e.g., Grocery shopping"
        />
      </div>

      {/* Amount */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>
      </div>

      {/* Category Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white cursor-pointer"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      {/* Date */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white cursor-pointer"
        />
      </div>
      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
      >
        Add Transaction
      </button>
    </form>
  )
}

export default TransactionForm