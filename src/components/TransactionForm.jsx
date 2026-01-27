import { useState } from 'react'
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

function TransactionForm({ onAddTransaction }) {
  const { getSymbol } = useCurrency()
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
      date: new Date(date).toISOString() 
    }

    onAddTransaction(transaction)
    
    setDescription('')
    setAmount('')
    setDate(new Date().toISOString().split('T')[0])
    setCategory('Other')
    setType('expense')
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-neutral-700">
      <h2 className="text-xl font-semibold text-neutral-200 tracking-tight mb-6">Add Transaction</h2>
      
      {/* Transaction Type Toggle */}
      <div className="flex gap-2 mb-6 p-1 bg-neutral-500 rounded-full">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 py-2.5 px-4 rounded-full text-sm font-bold transition-all duration-200 ${
            type === 'expense' 
              ? 'bg-black text-neutral-200 shadow-sm' 
              : 'text-neutral-200 hover:text-black'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 py-2.5 px-4 rounded-full text-sm font-bold transition-all duration-200 ${
            type === 'income' 
              ? 'bg-black text-neutral-200 shadow-sm' 
              : 'text-neutral-200 hover:text-black'
          }`}
        >
          Income
        </button>
      </div>

      {/* Description Input */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-neutral-200 mb-2">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was this for?"
          className="w-full px-4 py-3 bg-neutral-200 border border-neutral-200 rounded-xl text-black placeholder-neutral-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200"
          required
        />
      </div>

      {/* Amount Input */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-neutral-200 mb-2">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
            {getSymbol()}
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full pl-10 pr-4 py-3 bg-neutral-200 border border-neutral-200 rounded-xl text-black placeholder-neutral-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200"
            step="0.01"
            min="0"
            required
          />
        </div>
      </div>

      {/* Category Select */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-neutral-200 mb-2">
          Category
        </label>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-200 border border-neutral-200 rounded-xl text-black appearance-none cursor-pointer focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {/* Date Input */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-neutral-200 mb-2">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 bg-neutral-200 border border-neutral-200 rounded-xl text-black cursor-pointer focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-3.5 bg-violet-700 hover:bg-violet-900 text-neutral-200 font-bold rounded-xl transition-colors duration-200 active:scale-[0.98]"
      >
        Add Transaction
      </button>
    </form>
  )
}

export default TransactionForm