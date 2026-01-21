import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import Summary from './components/Summary'
import PieChart from './components/PieChart'
import LineChart from './components/LineChart'
import PrivacyPolicy from './components/PrivacyPolicy'
import DarkModeToggle from './components/DarkModeToggle'
import CurrencySelector from './components/CurrencySelector'
import BudgetManager from './components/BudgetManager'
import YearComparison from './components/YearComparison'
import { useCurrency } from './context/CurrencyContext'

function Dashboard() {
  const { formatAmount } = useCurrency()
  
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions')
    return saved ? JSON.parse(saved) : []
  })

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('budgets')
    return saved ? JSON.parse(saved) : {}
  })

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets))
  }, [budgets])

  // Transaction handlers 
  const addTransaction = (transaction) => {
    setTransactions([transaction, ...transactions])
  }

  const editTransaction = (id, updatedTransaction) => {
    setTransactions(transactions.map((t) => 
      t.id === id ? { ...updatedTransaction, id } : t))
  }
  
  const deleteTransaction = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id))
  }

  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export!')
      return
    }

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount']
    const csvData = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category,
      t.type,
      t.amount.toFixed(2)
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            Personal Finance Dashboard
          </h1>

          <p className="text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Track your income and expenses with ease
          </p>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
            <CurrencySelector />
            
            {transactions.length > 0 && (
              <button
                onClick={exportToCSV}
                className="bg-white dark:bg-gray-800 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium border border-gray-200 dark:border-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <Summary transactions={transactions} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8 lg:mb-10">
          <PieChart transactions={transactions} />
          <LineChart transactions={transactions} />
        </div>

        {/* Budget Manager */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <BudgetManager 
            budgets={budgets} 
            setBudgets={setBudgets} 
            transactions={transactions} 
          />
        </div>

        {/* Year-over-Year Comparison */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <YearComparison transactions={transactions} />
        </div>

        {/* Form and List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <TransactionForm onAddTransaction={addTransaction} />
          <TransactionList
            transactions={transactions}
            onDeleteTransaction={deleteTransaction}
            onEditTransaction={editTransaction}
          />
        </div>
      </div>
    </div>
  )
}

function App() {
  // Dark mode state - defaults to false (light mode)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      return JSON.parse(saved)
    }
    return false // Default to light mode
  })

  // Update localStorage and document class when darkMode changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <BrowserRouter>
      {/* Dark Mode Toggle - Fixed position */}
      <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>

        <footer className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          <Link to="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            Privacy Policy
          </Link>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App