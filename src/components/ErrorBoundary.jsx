import React from 'react'

// Production guardrail: if any render error occurs, show a recovery UI
// instead of a blank screen.

const STORAGE_KEYS_TO_RESET = [
  'transactions',
  'budgets',
  'currency',
  'transactionListPresets_v1',
  'privacyPreferences_v1',
  'theme',
  'last_tx_type',
  'last_tx_category',
  'backup_before_last_restore_v1',
]

function safeParseJSON(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function buildLocalBackup() {
  const transactions = safeParseJSON(localStorage.getItem('transactions')) || []
  const budgets = safeParseJSON(localStorage.getItem('budgets')) || {}
  const currency = localStorage.getItem('currency') || 'USD'
  const presets = safeParseJSON(localStorage.getItem('transactionListPresets_v1')) || []

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: {
      transactions,
      budgets,
      currency,
      presets,
      theme: localStorage.getItem('theme') || null,
      lastTxType: localStorage.getItem('last_tx_type') || null,
      lastTxCategory: localStorage.getItem('last_tx_category') || null,
      privacyPreferences: safeParseJSON(localStorage.getItem('privacyPreferences_v1')) || null,
    },
  }
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // Intentionally no remote logging (privacy-first, client-only app)
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleDownloadBackup = () => {
    try {
      const backup = buildLocalBackup()
      downloadJSON(
        backup,
        `finance_dashboard_crash_backup_${new Date().toISOString().slice(0, 10)}.json`
      )
    } catch (e) {
      alert('Could not create a backup from this browser.')
    }
  }

  handleResetLocalData = () => {
    const ok = window.confirm(
      'This will delete local data for this site (transactions, budgets, presets, preferences) in this browser. Continue?'
    )
    if (!ok) return

    try {
      STORAGE_KEYS_TO_RESET.forEach((k) => localStorage.removeItem(k))
    } catch {
      // ignore
    }
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const isDev = Boolean(import.meta?.env?.DEV)
    const errorMessage = this.state.error?.message || 'An unexpected error occurred.'

    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-neutral-300 mt-2">
            The app hit an unexpected error. You can reload, download a backup of your local data, or reset local data
            to recover.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200"
            >
              Reload
            </button>
            <button
              onClick={this.handleDownloadBackup}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
            >
              Download backup
            </button>
            <button
              onClick={this.handleResetLocalData}
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500"
            >
              Reset local data
            </button>
          </div>

          <div className="mt-5 text-sm text-neutral-400">
            If this keeps happening, try resetting local data or restoring from a known-good backup.
          </div>

          {isDev && (
            <pre className="mt-5 whitespace-pre-wrap text-xs text-neutral-300 bg-neutral-950 border border-neutral-800 rounded-xl p-4 overflow-auto">
{`Error: ${errorMessage}

${this.state.errorInfo?.componentStack || ''}`}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
