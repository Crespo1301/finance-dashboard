import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
]

function PieChart({ transactions }) {
  const expenses = transactions.filter((t) => t.type === 'expense')

  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount
    return acc
  }, {})

  const labels = Object.keys(categoryTotals)
  const dataValues = Object.values(categoryTotals)

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: COLORS.slice(0, labels.length),
        borderColor: '#ffffff',
        borderWidth: 3,
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
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    },
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-6xl mb-4">📈</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Expenses by Category</h2>
        <p className="text-gray-500 text-center">Add expense transactions to see the breakdown</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Expenses by Category</h2>
      <div className="flex items-center justify-center">
        <Pie data={data} options={options} />
      </div>
    </div>
  )
}

export default PieChart