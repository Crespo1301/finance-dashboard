function TransactionList({ transactions, onDeleteTransaction }) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Transactions</h2>
        <p className="text-gray-500">No transactions yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Transactions</h2>
      <ul className="space-y-2 max-h-96 overflow-y-auto">
        {transactions.map((transaction) => (
          <li
            key={transaction.id}
            className="flex justify-between items-center p-3 border rounded"
          >
            <div>
              <p className="font-medium">{transaction.description}</p>
              <p className="text-sm text-gray-500">{transaction.category}</p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
              </span>
              <button
                onClick={() => onDeleteTransaction(transaction.id)}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TransactionList
