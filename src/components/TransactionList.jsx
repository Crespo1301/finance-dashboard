import { useMemo, useState } from 'react'
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

const toISODateInputValue = (dateLike) => {
  const d = new Date(dateLike)
  if (!Number.isFinite(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const safeNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function TransactionList({
  transactions,
  onDeleteTransaction,
  onEditTransaction,
  onDuplicateTransaction, // NEW
  onHoverCategory, // optional; already used in your App.jsx
}) {
  const { formatAmount } = useCurrency()

  const [editingId, setEditingId] = useState(null)
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

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        (t.description || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      const matchesCategory =
        filterCategory === 'All' || t.category === filterCategory
      const matchesType = filterType === 'All' || t.type === filterType
      return matchesSearch && matchesCategory && matchesType
    })
  }, [transactions, searchTerm, filterCategory, filterType])

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('All')
    setFilterType('All')
  }

  const beginEdit = (transaction) => {
    setEditingId(transaction.id)
    setEditForm({
      description: transaction.description ?? '',
      amount: String(transaction.amount ?? ''),
      category: transaction.category ?? 'Other',
      type: transaction.type === 'income' ? 'income' : 'expense',
      date: toISODateInputValue(transaction.date),
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
    const nextType = editForm.type === 'income' ? 'income' : 'expense'
    const nextAmount = safeNumber(editForm.amount)

    // Keep a valid ISO date string (midday avoids timezone edge cases)
    const nextDate = editForm.date
      ? new Date(`${editForm.date}T12:00:00`).toISOString()
      : new Date().toISOString()

    onEditTransaction(original.id, {
      ...original,
      description: editForm.description,
      amount: nextAmount,
      category: editForm.category || 'Other',
      type: nextType,
      date: nextDate,
    })

    cancelEdit()
  }

  if (transactions.length === 0) {
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
        <h2 className="text-xl font-semibold text-neutral-200 mb-2">
          No Transactions Yet
        </h2>
        <p className="text-neutral-400 text-center text-sm">
          Start by adding your first transaction
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-neutral-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-200 tracking-tight">
          Transactions
        </h2>
        <span className="px-3 py-1 bg-neutral-500 text-neutral-200 text-xs font-medium rounded-full">
          {transactions.length}
        </span>
      </div>

      {/* Search & Filters */}
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
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-neutral-200 border border-neutral-200 rounded-xl text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-neutral-200 border border-neutral-200 rounded-lg text-neutral-900 text-sm appearance-none cursor-pointer focus:outline-none focus:border-violet-500 transition-colors"
          >
            <option value="All">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
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

          {(searchTerm || filterCategory !== 'All' || filterType !== 'All') && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 bg-neutral-200 hover:bg-neutral-400 rounded-lg text-neutral-900 text-sm font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Empty Filter Results */}
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
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredTransactions.map((transaction) => {
            const isEditing = editingId === transaction.id
            const isIncome = transaction.type === 'income'
            const amountText = `${isIncome ? '+' : '-'}${formatAmount(
              safeNumber(transaction.amount)
            )}`

            return (
              <div
                key={transaction.id}
                className="group flex items-center gap-4 p-4 bg-neutral-200 rounded-xl hover:shadow-sm transition-all duration-200"
                onMouseEnter={() => onHoverCategory?.(transaction.category || null)}
                onMouseLeave={() => onHoverCategory?.(null)}
              >
                {isEditing ? (
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, description: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-black text-sm focus:outline-none focus:border-violet-500"
                        placeholder="Description"
                      />

                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, date: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-black text-sm focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, amount: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-black text-sm focus:outline-none focus:border-violet-500"
                        placeholder="Amount"
                        step="0.01"
                      />

                      <select
                        value={editForm.type}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, type: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-black text-sm focus:outline-none focus:border-violet-500"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>

                      <select
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, category: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-black text-sm focus:outline-none focus:border-violet-500"
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
                        onClick={() => saveEdit(transaction)}
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
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-black truncate">
                        {transaction.description}
                      </p>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-neutral-300 text-neutral-800 rounded-full">
                          {transaction.category}
                        </span>

                        <span className="text-xs px-2 py-0.5 bg-neutral-300 text-neutral-800 rounded-full">
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </span>

                        <span className="text-xs text-neutral-500">
                          {new Date(transaction.date).toLocaleDateString('en-US', {
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

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Duplicate */}
                        <button
                          onClick={() => onDuplicateTransaction?.(transaction)}
                          className="p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-300 rounded-lg transition-colors"
                          aria-label="Duplicate"
                          title="Duplicate"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 3.75H8.25A2.25 2.25 0 0 0 6 6v7.5"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 20.25h6.75A2.25 2.25 0 0 0 18 18v-9A2.25 2.25 0 0 0 15.75 6.75H9A2.25 2.25 0 0 0 6.75 9v9A2.25 2.25 0 0 0 9 20.25Z"
                            />
                          </svg>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => beginEdit(transaction)}
                          className="p-2 text-neutral-700 hover:text-violet-600 hover:bg-violet-200 rounded-lg transition-colors"
                          aria-label="Edit"
                          title="Edit"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                            />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteTransaction(transaction.id)}
                          className="p-2 text-neutral-700 hover:text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                          aria-label="Delete"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TransactionList
