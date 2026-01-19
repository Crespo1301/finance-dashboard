import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import Summary from './components/Summary'
import PieChart from './components/PieChart'
import LineChart from './components/LineChart'
import PrivacyPolicy from './components/PrivacyPolicy'

function Dashboard() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }, [transactions])

  const addTransaction = (transaction) => {
    setTransactions([transaction, ...transactions])
  }

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id))
  }

  return (
    <>
      <div className="mb-8">
        <Summary transactions={transactions} />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <PieChart transactions={transactions} />
        <LineChart transactions={transactions} />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <TransactionForm onAddTransaction={addTransaction} />
        <TransactionList
          transactions={transactions}
          onDeleteTransaction={deleteTransaction}
        />
      </div>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Personal Finance Dashboard
          </h1>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>

          <footer className="mt-8 text-center text-gray-500 text-sm">
            <Link to="/privacy" className="hover:text-gray-700">Privacy Policy</Link>
          </footer>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App