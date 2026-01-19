function Summary({ transactions }) {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = income - expenses

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {/* Income Card */}
      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-green-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-600 font-medium">Income</p>
          <span className="text-2xl">💰</span>
        </div>
        <p className="text-3xl font-bold text-green-600">${income.toFixed(2)}</p>
        <p className="text-xs text-gray-500 mt-1">Total earnings</p>
      </div>

      {/* Expenses Card */}
      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-red-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-600 font-medium">Expenses</p>
          <span className="text-2xl">💸</span>
        </div>
        <p className="text-3xl font-bold text-red-600">${expenses.toFixed(2)}</p>
        <p className="text-xs text-gray-500 mt-1">Total spending</p>
      </div>

      {/* Balance Card */}
      <div className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border ${
        balance >= 0 ? 'border-blue-100' : 'border-orange-100'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-600 font-medium">Balance</p>
          <span className="text-2xl">{balance >= 0 ? '✨' : '⚠️'}</span>
        </div>
        <p className={`text-3xl font-bold ${
          balance >= 0 ? 'text-blue-600' : 'text-orange-600'
        }`}>
          ${Math.abs(balance).toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 mt-1">{balance >= 0 ? 'Available funds' : 'Over budget'}</p>
      </div>
    </div>
  )
}

export default Summary