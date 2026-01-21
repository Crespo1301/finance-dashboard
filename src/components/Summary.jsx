import { useCurrency } from '../context/CurrencyContext'

function Summary({ transactions }) {
  const { formatAmount } = useCurrency()

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = income - expenses

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-600 font-medium">Income</p>
        </div>
        <p className="text-3xl font-bold text-green-600">{formatAmount(income)}</p>
        <p className="text-xs text-gray-500 mt-1">Total earnings</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-600 font-medium">Expenses</p>
        </div>
        <p className="text-3xl font-bold text-red-600">{formatAmount(expenses)}</p>
        <p className="text-xs text-gray-500 mt-1">Total spending</p>
      </div>

      <div className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border ${
        balance >= 0 ? 'border-blue-100' : 'border-orange-100'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-600 font-medium">Balance</p>
        </div>
        <p className={`text-3xl font-bold ${
          balance >= 0 ? 'text-blue-600' : 'text-orange-600'
        }`}>
          {formatAmount(Math.abs(balance))}
        </p>
        <p className="text-xs text-gray-500 mt-1">{balance >= 0 ? 'Available funds' : 'Over budget'}</p>
      </div>
    </div>
  )
}

export default Summary