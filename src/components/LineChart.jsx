import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useCurrency } from '../context/CurrencyContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function LineChart({ transactions }) {
  const { formatAmount } = useCurrency()

  const monthlyData = transactions.reduce((acc, t) => {
    const date = new Date(t.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!acc[monthKey]) {
      acc[monthKey] = { income: 0, expenses: 0 }
    }
    
    if (t.type === 'income') {
      acc[monthKey].income += t.amount
    } else {
      acc[monthKey].expenses += t.amount
    }
    
    return acc
  }, {})

  const sortedMonths = Object.keys(monthlyData).sort()
  
  const formatMonth = (monthKey) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(year, parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const labels = sortedMonths.map(formatMonth)
  const incomeData = sortedMonths.map((m) => monthlyData[m].income)
  const expenseData = sortedMonths.map((m) => monthlyData[m].expenses)

  const data = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  }

  const isDark = document.documentElement.classList.contains('dark')
  
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'circle',
          color: isDark ? '#e5e7eb' : '#374151'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatAmount(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value) {
            return formatAmount(value);
          },
          font: {
            size: 11
          },
          color: isDark ? '#9ca3af' : '#6b7280'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: isDark ? '#9ca3af' : '#6b7280'
        }
      }
    },
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center min-h-[400px] transition-colors duration-300">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Monthly Trend</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">Track your income and expenses over time</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">Monthly Trend</h2>
      <div className="flex items-center justify-center">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}

export default LineChart