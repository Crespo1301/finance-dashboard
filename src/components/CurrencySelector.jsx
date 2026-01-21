import { useCurrency } from '../context/CurrencyContext'

function CurrencySelector() {
  const { currency, setCurrency, currencies } = useCurrency()

  return (
    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
      <span className="text-sm text-gray-600 font-medium">Currency:</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="px-3 py-1.5 border-2 border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
      >
        {Object.entries(currencies).map(([code, { name, symbol }]) => (
          <option key={code} value={code}>
            {symbol} {code} - {name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default CurrencySelector