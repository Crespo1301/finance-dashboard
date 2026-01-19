function Summary({ transactions }) {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = income - expenses

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-md text-center">
        <p className="text-gray-500">Income</p>
        <p className="text-2xl font-bold text-green-500">${income.toFixed(2)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md text-center">
        <p className="text-gray-500">Expenses</p>
        <p className="text-2xl font-bold text-red-500">${expenses.toFixed(2)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md text-center">
        <p className="text-gray-500">Balance</p>
        <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          ${balance.toFixed(2)}
        </p>
      </div>
    </div>
  )
}

export default Summary
