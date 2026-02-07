import { useMemo } from 'react'
import { useCurrency } from '../context/CurrencyContext'
import { normalizeTransactions, safeNumber } from '../utils/transactions'

function Summary({ transactions }) {
  const { formatAmount } = useCurrency()

  const safeTransactions = useMemo(() => normalizeTransactions(transactions), [transactions])

  const { income, expenses } = useMemo(() => {
    let inc = 0
    let exp = 0
    for (const t of safeTransactions) {
      const amt = safeNumber(t.amount)
      if (t.type === 'income') inc += amt
      else if (t.type === 'expense') exp += amt
    }
    return { income: inc, expenses: exp }
  }, [safeTransactions])

  const balance = income - expenses

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      <div className="group p-6 sm:p-8 rounded-2xl bg-neutral-700 hover:bg-neutral-800 transition-colors duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="text-neutral-200 text-sm font-medium tracking-wide uppercase">Income</span>
        </div>
        <p className="text-3xl sm:text-4xl font-semibold text-neutral-200 tracking-tight">
          {formatAmount(income)}
        </p>
        <p className="text-neutral-200 text-sm mt-2">Total earnings</p>
      </div>

      <div className="group p-6 sm:p-8 rounded-2xl bg-neutral-700 hover:bg-neutral-800 transition-colors duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </div>
          <span className="text-neutral-200 text-sm font-medium tracking-wide uppercase">Expenses</span>
        </div>
        <p className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
          {formatAmount(expenses)}
        </p>
        <p className="text-neutral-200 text-sm mt-2">Total spending</p>
      </div>

      <div
        className={`group p-6 sm:p-8 rounded-2xl transition-colors duration-300 ${
          balance >= 0 ? 'bg-violet-900 hover:bg-violet-950' : 'bg-neutral-900 hover:bg-black'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${balance >= 0 ? 'bg-violet-700' : 'bg-white'}`}>
            <svg className={`w-5 h-5 ${balance >= 0 ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <span className={`text-sm font-medium tracking-wide uppercase ${balance >= 0 ? 'text-neutral-200' : 'text-neutral-400'}`}>Balance</span>
        </div>
        <p className={`text-3xl sm:text-4xl font-semibold tracking-tight ${balance >= 0 ? 'text-neutral-200' : 'text-white'}`}>
          {balance < 0 && '-'}{formatAmount(Math.abs(balance))}
        </p>
        <p className={`text-sm mt-2 ${balance >= 0 ? 'text-neutral-200' : 'text-neutral-500'}`}>
          {balance >= 0 ? 'Available funds' : 'Over budget'}
        </p>
      </div>
    </div>
  )
}

export default Summary
