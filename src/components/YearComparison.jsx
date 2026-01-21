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
        backgroundColor: '#000000',
        borderColor: '#000000',
        borderWidth: 0,
        borderRadius: 6,
      },
      {
        label: 'Expenses',
        data: years.map(y => yearlyData[y].expenses),
        backgroundColor: '#a3a3a3',
        borderColor: '#a3a3a3',
        borderWidth: 0,
        borderRadius: 6,
      },
      {
        label: 'Savings',
        data: years.map(y => yearlyData[y].income - yearlyData[y].expenses),
        backgroundColor: '#7c3aed',
        borderColor: '#7c3aed',
        borderWidth: 0,
        borderRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 3, // This controls height - higher number = shorter chart
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#525252',
          padding: 20,
          font: {
            family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            size: 12,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'rectRounded'
        }
      },
      tooltip: {
        backgroundColor: '#000000',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 14,
        cornerRadius: 12,
        titleFont: {
          family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
          size: 13,
          weight: '600'
        },
        bodyFont: {
          family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
          size: 13
        },
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatAmount(context.parsed.y)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        border: {
          display: false
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawTicks: false
        },
        ticks: {
          callback: (value) => formatAmount(value),
          color: '#a3a3a3',
          font: {
            family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            size: 11
          },
          padding: 8
        }
      },
      x: {
        border: {
          display: false
        },
        grid: {
          display: false
        },
        ticks: {
          color: '#a3a3a3',
          font: {
            family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            size: 11
          },
          padding: 8
        }
      }
    }
  }

  const ChangeIndicator = ({ value, isPercentage = true }) => {
    if (value === null) return <span className="text-neutral-300">-</span>
    const isPositive = value > 0
    
    return (
      <span className={`inline-flex items-center gap-1 font-medium ${isPositive ? 'text-black' : 'text-neutral-500'}`}>
        <svg className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
        </svg>
        {isPercentage ? `${Math.abs(value).toFixed(1)}%` : formatAmount(Math.abs(value))}
      </span>
    )
  }

  if (years.length === 0) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-neutral-50 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-black mb-2">Year Comparison</h2>
        <p className="text-neutral-500 text-sm text-center">Add transactions to compare yearly performance</p>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-neutral-50">
      <h2 className="text-xl font-semibold text-black tracking-tight mb-6">Year Comparison</h2>
      
      {/* Chart */}
      <div className="mb-8">
        <Bar data={chartData} options={options} />
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-3 font-medium text-neutral-500">Year</th>
              <th className="text-right py-3 px-3 font-medium text-neutral-500">Income</th>
              <th className="text-right py-3 px-3 font-medium text-neutral-500">YoY</th>
              <th className="text-right py-3 px-3 font-medium text-neutral-500">Expenses</th>
              <th className="text-right py-3 px-3 font-medium text-neutral-500">YoY</th>
              <th className="text-right py-3 px-3 font-medium text-neutral-500">Savings</th>
              <th className="text-right py-3 px-3 font-medium text-neutral-500">Change</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row) => (
              <tr key={row.year} className="border-b border-neutral-100 hover:bg-white transition-colors">
                <td className="py-3 px-3 font-semibold text-black">{row.year}</td>
                <td className="py-3 px-3 text-right text-black tabular-nums">{formatAmount(row.income)}</td>
                <td className="py-3 px-3 text-right"><ChangeIndicator value={row.incomeChange} /></td>
                <td className="py-3 px-3 text-right text-neutral-600 tabular-nums">{formatAmount(row.expenses)}</td>
                <td className="py-3 px-3 text-right"><ChangeIndicator value={row.expenseChange} /></td>
                <td className={`py-3 px-3 text-right font-semibold tabular-nums ${row.savings >= 0 ? 'text-violet-600' : 'text-black'}`}>
                  {row.savings < 0 && '-'}{formatAmount(Math.abs(row.savings))}
                </td>
                <td className="py-3 px-3 text-right"><ChangeIndicator value={row.savingsChange} isPercentage={false} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default YearComparison