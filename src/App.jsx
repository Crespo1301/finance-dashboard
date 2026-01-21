import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import Summary from './components/Summary'
import PieChart from './components/PieChart'
import LineChart from './components/LineChart'
import PrivacyPolicy from './components/PrivacyPolicy'
import CurrencySelector from './components/CurrencySelector'
import BudgetManager from './components/BudgetManager'
import YearComparison from './components/YearComparison'

function Dashboard() {
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
    <div className="min-h-screen bg-neutral-950 p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 sm:mb-16">
         
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white text-center mb-3">
            Finance
          </h1>
          <p className="text-center text-neutral-400 text-base sm:text-lg font-normal tracking-wide">
            Track your income and expenses
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-6">
            <CurrencySelector />
            
            {transactions.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition-colors duration-200"
              > 
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export CSV
              </button>
            )}
          </div>
        </header>

        {/* Summary Cards */}
        <section className="mb-12 sm:mb-16">
          <Summary transactions={transactions} />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <PieChart transactions={transactions} />
          <LineChart transactions={transactions} />
        </section>

        {/* Budget Manager */}
        <section className="mb-12 sm:mb-16">
          <BudgetManager 
            budgets={budgets} 
            setBudgets={setBudgets} 
            transactions={transactions} 
          />
        </section>

        {/* Year Comparison */}
        <section className="mb-12 sm:mb-16">
          <YearComparison transactions={transactions} />
        </section>

        {/* Transaction Form & List */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <TransactionForm onAddTransaction={addTransaction} />
          <TransactionList
            transactions={transactions}
            onDeleteTransaction={deleteTransaction}
            onEditTransaction={editTransaction}
          />
        </section>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-950">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>

        <footer className="py-10 text-center border-t border-neutral-800">
          <Link 
            to="/privacy" 
            className="text-neutral-500 hover:text-white text-sm font-normal transition-colors duration-200"
          >
            Privacy Policy
          </Link>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App