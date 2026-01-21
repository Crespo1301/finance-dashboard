import { createContext, useContext, useState, useEffect } from 'react'

const CurrencyContext = createContext()

const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', rate: 1 },
  EUR: { symbol: '€', name: 'Euro', rate: 0.92 },
  GBP: { symbol: '£', name: 'British Pound', rate: 0.79 },
  JPY: { symbol: '¥', name: 'Japanese Yen', rate: 149.50 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', rate: 1.53 },
  MXN: { symbol: 'MX$', name: 'Mexican Peso', rate: 17.15 },
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('currency')
    return saved || 'USD'
  })

  useEffect(() => {
    localStorage.setItem('currency', currency)
  }, [currency])

  const formatAmount = (amount, fromCurrency = 'USD') => {
    const curr = CURRENCIES[currency]
    const fromRate = CURRENCIES[fromCurrency]?.rate || 1
    const convertedAmount = (amount / fromRate) * curr.rate
    
    return `${curr.symbol}${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const convertAmount = (amount, fromCurrency = 'USD') => {
    const fromRate = CURRENCIES[fromCurrency]?.rate || 1
    return (amount / fromRate) * CURRENCIES[currency].rate
  }

  const getSymbol = () => {
    return CURRENCIES[currency].symbol
  }

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      currencies: CURRENCIES,
      formatAmount,
      convertAmount,
      getSymbol
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)