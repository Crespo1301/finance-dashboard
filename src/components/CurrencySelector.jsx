import { useCurrency } from '../context/CurrencyContext'

function CurrencySelector() {
  const { currency, setCurrency, currencies } = useCurrency()

  return (
    <div className="relative">
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="appearance-none pl-4 pr-10 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-black text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors duration-200"
      >
        {Object.entries(currencies).map(([code, { name, symbol }]) => (
          <option key={code} value={code}>
            {symbol} {code}
          </option>
        ))}
      </select>
      <svg 
        className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={2} 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}

export default CurrencySelector