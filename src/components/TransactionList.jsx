import { useState } from 'react'

function TransactionList({ transactions, onDeleteTransaction, onEditTransaction }) {
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterType, setFilterType] = useState('All')

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory
    const matchesType = filterType === 'All' || t.type === filterType
    return matchesSearch && matchesCategory && matchesType
  })

  // No transactions at all
  if (transactions.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">No Transactions Yet</h2>
        <p className="text-gray-500 text-center">Start by adding your first income or expense transaction</p>
      </div>
    )
  }

  // Has transactions but no matches from filter
  if (filteredTransactions.length === 0) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Recent Transactions</h2>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
            {transactions.length}
          </span>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-sm"
            >
              <option value="All">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-sm"
            >
              <option value="All">All Categories</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Food">Food</option>
              <option value="Health">Health</option>
              <option value="Housing">Housing</option>
              <option value="Transportation">Transportation</option>
              <option value="Utilities">Utilities</option>
              <option value="Shopping">Shopping</option>
              <option value="Income">Income</option>
              <option value="Other">Other</option>
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterCategory('All')
                setFilterType('All')
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2 text-gray-800">No Matches Found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Recent Transactions</h2>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
          {transactions.length}
        </span>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-sm"
          >
            <option value="All">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-sm"
          >
            <option value="All">All Categories</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Food">Food</option>
            <option value="Health">Health</option>
            <option value="Housing">Housing</option>
            <option value="Transportation">Transportation</option>
            <option value="Utilities">Utilities</option>
            <option value="Shopping">Shopping</option>
            <option value="Income">Income</option>
            <option value="Other">Other</option>
          </select>
          
          {(searchTerm || filterCategory !== 'All' || filterType !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterCategory('All')
                setFilterType('All')
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {/* Transaction List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-md transition-all group"
          >
            {editingId === transaction.id ? (
              // EDIT MODE
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Description"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                    className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Amount"
                    step="0.01"
                  />
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className="px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Entertainment">Entertainment</option>
                    <option value="Food">Food</option>
                    <option value="Health">Health</option>
                    <option value="Housing">Housing</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Income">Income</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onEditTransaction(transaction.id, {
                        ...transaction,
                        description: editForm.description,
                        amount: parseFloat(editForm.amount),
                        category: editForm.category
                      })
                      setEditingId(null)
                    }}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // VIEW MODE
              <>
                <div className="flex-1 min-w-0 mr-4">
                  <p className="font-semibold text-gray-800 truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {transaction.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(transaction.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold text-lg whitespace-nowrap ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => {
                      setEditingId(transaction.id)
                      setEditForm({
                        description: transaction.description,
                        amount: transaction.amount,
                        category: transaction.category
                      })
                    }}
                    className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Edit transaction"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(transaction.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Delete transaction"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TransactionList