import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import RestorePreviewModal from './RestorePreviewModal'
import {
  buildBackupObject,
  downloadBackupObject,
  parseBackupText,
  applyBackupToStorage,
} from '../utils/backup'

export default function Settings() {
  const fileInputRef = useRef(null)
  const [restorePreview, setRestorePreview] = useState(null)
  const [restoreData, setRestoreData] = useState(null)
  const [isRestoreOpen, setIsRestoreOpen] = useState(false)

  const stats = useMemo(() => {
    const txRaw = localStorage.getItem('transactions')
    const budgetsRaw = localStorage.getItem('budgets')
    const presetsRaw = localStorage.getItem('transactionListPresets_v1')

    let tx = []
    let budgets = {}
    let presets = []
    try {
      tx = txRaw ? JSON.parse(txRaw) : []
    } catch {
      tx = []
    }
    try {
      budgets = budgetsRaw ? JSON.parse(budgetsRaw) : {}
    } catch {
      budgets = {}
    }
    try {
      presets = presetsRaw ? JSON.parse(presetsRaw) : []
    } catch {
      presets = []
    }

    const budgetMonths = budgets && typeof budgets === 'object' ? Object.keys(budgets).length : 0

    return {
      transactionCount: Array.isArray(tx) ? tx.length : 0,
      budgetMonths,
      presetCount: Array.isArray(presets) ? presets.length : 0,
      hasUndo: Boolean(localStorage.getItem('backup_before_last_restore_v1')),
    }
  }, [])

  const backupNow = () => {
    const backup = buildBackupObject()
    downloadBackupObject(backup, `finance_dashboard_backup_${new Date().toISOString().slice(0, 10)}.json`)
  }

  const requestRestore = () => fileInputRef.current?.click()

  const closePreview = () => {
    setIsRestoreOpen(false)
    setRestorePreview(null)
    setRestoreData(null)
  }

  const restoreFromFile = async (file) => {
    if (!file) return
    try {
      const text = await file.text()
      const parsed = parseBackupText(text)
      if (!parsed.ok) {
        alert(parsed.error || 'Invalid backup file.')
        return
      }

      setRestorePreview({
        exportedAt: parsed.exportedAt,
        warnings: parsed.warnings,
        summary: parsed.summary,
      })
      setRestoreData(parsed.data)
      setIsRestoreOpen(true)
    } catch (e) {
      console.error(e)
      alert('Could not read this file.')
    }
  }

  const confirmRestore = () => {
    if (!restoreData) return
    try {
      // Save undo point as a full backup object
      try {
        localStorage.setItem('backup_before_last_restore_v1', JSON.stringify(buildBackupObject()))
      } catch {
        // ignore
      }

      applyBackupToStorage(restoreData)
      window.dispatchEvent(new CustomEvent('transactionListPresetsUpdated'))
      alert('Restore complete. Reloading…')
      window.location.assign('/')
    } catch (e) {
      console.error(e)
      alert('Could not restore.')
    }
  }

  const undoLastRestore = () => {
    const raw = localStorage.getItem('backup_before_last_restore_v1')
    if (!raw) return alert('No undo backup found.')
    try {
      const parsed = parseBackupText(raw)
      if (!parsed.ok) return alert('Undo backup is corrupted.')
      applyBackupToStorage(parsed.data)
      window.dispatchEvent(new CustomEvent('transactionListPresetsUpdated'))
      alert('Undo complete. Reloading…')
      window.location.assign('/')
    } catch (e) {
      console.error(e)
      alert('Could not undo restore.')
    }
  }

  const resetAll = () => {
    const ok = window.confirm(
      'This will permanently delete ALL local data (transactions, budgets, presets, privacy preferences) from this browser. Continue?'
    )
    if (!ok) return

    const keys = [
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
    keys.forEach((k) => localStorage.removeItem(k))
    alert('All local data cleared. Reloading…')
    window.location.assign('/')
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-white">Settings</h1>
            <p className="text-neutral-400 mt-1 text-sm">Data portability, privacy, and resets.</p>
          </div>
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-100 hover:bg-neutral-700 text-sm"
          >
            ← Back
          </Link>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h2 className="text-lg font-semibold text-white">Your local data</h2>
            <div className="mt-2 text-sm text-neutral-400">
              <div>
                Transactions: <span className="text-neutral-200">{stats.transactionCount}</span>
              </div>
              <div>
                Budget months: <span className="text-neutral-200">{stats.budgetMonths}</span>
              </div>
              <div>
                Saved presets: <span className="text-neutral-200">{stats.presetCount}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h2 className="text-lg font-semibold text-white">Backup & restore</h2>
            <p className="text-sm text-neutral-400 mt-2">
              Download a portable JSON backup or restore from a backup file. Restores are validated and previewed before applying.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={backupNow}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-100 hover:bg-neutral-700 text-sm"
              >
                Download backup (JSON)
              </button>

              <button
                onClick={requestRestore}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-100 hover:bg-neutral-700 text-sm"
              >
                Restore from file
              </button>

              <button
                onClick={undoLastRestore}
                disabled={!stats.hasUndo}
                className={`px-4 py-2 rounded-xl text-sm ${
                  stats.hasUndo
                    ? 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
                    : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                }`}
                title={!stats.hasUndo ? 'No undo backup found yet.' : 'Revert to the state before your last restore.'}
              >
                Undo last restore
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                restoreFromFile(f)
              }}
            />
          </section>

          <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h2 className="text-lg font-semibold text-white">Reset</h2>
            <p className="text-sm text-neutral-400 mt-2">
              Clears all local data stored in this browser for this site. This cannot be undone (except if you downloaded a backup).
            </p>
            <div className="mt-4">
              <button
                onClick={resetAll}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-500 text-sm"
              >
                Reset all local data
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h2 className="text-lg font-semibold text-white">Privacy</h2>
            <p className="text-sm text-neutral-400 mt-2">
              Manage optional ads/analytics preferences in the footer of the main dashboard.
            </p>
            <div className="mt-3 flex gap-3">
              <Link to="/privacy" className="text-sm text-neutral-200 hover:text-white underline">
                Privacy Policy
              </Link>
            </div>
          </section>
        </div>
      </div>

      <RestorePreviewModal
        isOpen={isRestoreOpen}
        onClose={closePreview}
        onConfirm={confirmRestore}
        preview={restorePreview}
      />
    </div>
  )
}
