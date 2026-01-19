function TransactionList({ transactions, onDeleteTransaction }) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">No Transactions Yet</h2>
        <p className="text-gray-500 text-center">Start by adding your first income or expense transaction</p>
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
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-md transition-all group"
          >
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
                onClick={() => onDeleteTransaction(transaction.id)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Delete transaction"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TransactionList