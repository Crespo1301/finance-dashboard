import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App crash:', error, info)
  }

  resetApp = () => {
    const keys = [
      'transactions',
      'budgets',
      'transactionListPresets_v1',
      'backup_before_last_restore_v1',
      'privacyPreferences_v1',
      'theme',
      'last_tx_type',
      'last_tx_category',
    ]
    keys.forEach((k) => localStorage.removeItem(k))
    window.location.reload()
  }

  downloadBackup = () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
        budgets: JSON.parse(localStorage.getItem('budgets') || '{}'),
        presets: JSON.parse(localStorage.getItem('transactionListPresets_v1') || '[]'),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'finance_dashboard_emergency_backup.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Unable to generate backup.')
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
          <h1 className="text-xl font-semibold text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-neutral-400 mb-6">
            A local data issue caused the app to crash. You can recover safely below.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200"
            >
              Reload app
            </button>

            <button
              onClick={this.downloadBackup}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700"
            >
              Download emergency backup
            </button>

            <button
              onClick={this.resetApp}
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500"
            >
              Reset all local data
            </button>
          </div>
        </div>
      </div>
    )
  }
}
