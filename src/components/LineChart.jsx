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
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
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
        borderColor: '#000000',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#000000',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#7c3aed',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            size: 12,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#525252'
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
          label: function(context) {
            return `${context.dataset.label}: ${formatAmount(context.parsed.y)}`
          }
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

  if (transactions.length === 0) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-neutral-50 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-black mb-2">Monthly Trends</h2>
        <p className="text-neutral-500 text-sm text-center">Add transactions to see monthly patterns</p>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-neutral-50">
      <h2 className="text-xl font-semibold text-black tracking-tight mb-6">Monthly Trends</h2>
      <div>
        <Line data={data} options={options} />
      </div>
    </div>
  )
}

export default LineChart