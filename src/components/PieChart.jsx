import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useCurrency } from '../context/CurrencyContext'

ChartJS.register(ArcElement, Tooltip, Legend)

// Monochromatic palette with purple accent
const COLORS = [
  '#7c3aed', // violet-600 - primary accent
  '#1a1a1a', // near black
  '#404040', // neutral-700
  '#525252', // neutral-600
  '#737373', // neutral-500
  '#a3a3a3', // neutral-400
  '#d4d4d4', // neutral-300
  '#e5e5e5', // neutral-200
]

function PieChart({ transactions }) {
  const { formatAmount } = useCurrency()
  const expenses = transactions.filter((t) => t.type === 'expense')

  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount
    return acc
  }, {})

  const sortedEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
  const labels = sortedEntries.map(([label]) => label)
  const dataValues = sortedEntries.map(([, value]) => value)

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: COLORS.slice(0, labels.length),
        borderColor: '#404040',
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
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
          color: '#e5e5e5',
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: '#000000',
        titleColor: '#e5e5e5',
        bodyColor: '#e5e5e5',
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
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatAmount(value)} (${percentage}%)`;
          }
        }
      }
    },
  }

  if (expenses.length === 0) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-neutral-700 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-neutral-500 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-neutral-200 mb-2">Expense Breakdown</h2>
        <p className="text-neutral-400 text-sm text-center">Add expenses to see category distribution</p>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-neutral-700">
      <h2 className="text-xl font-semibold text-neutral-200 tracking-tight mb-6">Expense Breakdown</h2>
      <div className="flex items-center justify-center">
        <div className="w-full max-w-[320px]">
          <Pie data={data} options={options} />
        </div>
      </div>
    </div>
  )
}

export default PieChart