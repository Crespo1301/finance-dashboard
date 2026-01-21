import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useCurrency } from '../context/CurrencyContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function YearComparison({ transactions }) {
  const { formatAmount } = useCurrency()

  const yearlyData = useMemo(() => {
    const data = {}
    
    transactions.forEach(t => {
      const year = new Date(t.date).getFullYear()
      if (!data[year]) {
        data[year] = { income: 0, expenses: 0 }
      }
      if (t.type === 'income') {
        data[year].income += t.amount
      } else {
        data[year].expenses += t.amount
      }
    })
    
    return data
  }, [transactions])

  const years = Object.keys(yearlyData).sort()
  
  const comparisons = years.map((year, index) => {
    const current = yearlyData[year]
    const previous = index > 0 ? yearlyData[years[index - 1]] : null
    
    return {
      year,
      income: current.income,
      expenses: current.expenses,
      savings: current.income - current.expenses,
      incomeChange: previous && previous.income > 0 ? ((current.income - previous.income) / previous.income * 100) : null,
      expenseChange: previous && previous.expenses > 0 ? ((current.expenses - previous.expenses) / previous.expenses * 100) : null,
      savingsChange: previous ? (current.income - current.expenses) - (previous.income - previous.expenses) : null,
    }
  })

  const chartData = {
    labels: years,
    datasets: [
      {
        label: 'Income',
        data: years.map(y => yearlyData[y].income),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: '#22c55e',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Expenses',
        data: years.map(y => yearlyData[y].expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: '#ef4444',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Savings',
        data: years.map(y => yearlyData[y].income - yearlyData[y].expenses),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#374151',
          padding: 15,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatAmount(context.parsed.y)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => formatAmount(value),
          color: '#6b7280'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280'
        }
      }
    }
  }

  const ChangeIndicator = ({ value, isPercentage = true }) => {
    if (value === null) return <span className="text-gray-400">—</span>
    const isPositive = value > 0
    const color = isPositive ? 'text-green-600' : 'text-red-600'
    const arrow = isPositive ? '↑' : '↓'
    
    return (
      <span className={`font-semibold ${color}`}>
        {arrow} {isPercentage ? `${Math.abs(value).toFixed(1)}%` : formatAmount(Math.abs(value))}
      </span>
    )
  }

  if (years.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Year-over-Year Comparison</h2>
        <p className="text-gray-500">Add transactions to see yearly comparisons</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Year-over-Year Comparison</h2>
      
      <div className="mb-8">
        <Bar data={chartData} options={options} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-2 font-semibold text-gray-700">Year</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Income</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">YoY</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Expenses</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">YoY</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Savings</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Change</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row) => (
              <tr key={row.year} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 font-semibold text-gray-800">{row.year}</td>
                <td className="py-3 px-2 text-right text-green-600">{formatAmount(row.income)}</td>
                <td className="py-3 px-2 text-right"><ChangeIndicator value={row.incomeChange} /></td>
                <td className="py-3 px-2 text-right text-red-600">{formatAmount(row.expenses)}</td>
                <td className="py-3 px-2 text-right"><ChangeIndicator value={row.expenseChange} /></td>
                <td className={`py-3 px-2 text-right font-semibold ${row.savings >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatAmount(row.savings)}
                </td>
                <td className="py-3 px-2 text-right"><ChangeIndicator value={row.savingsChange} isPercentage={false} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default YearComparison