import { useEffect, useRef } from 'react'
import useFocusTrap from '../utils/useFocusTrap'

export default function RestorePreviewModal({ isOpen, onClose, onConfirm, preview }) {
  const dialogRef = useRef(null)
  useFocusTrap(dialogRef, isOpen)

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/60" aria-label="Close restore preview" onClick={onClose} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full sm:max-w-lg bg-neutral-950 border border-neutral-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Restore preview</h2>
            <p className="text-xs text-neutral-400 mt-1">Review what will be restored before continuing.</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mt-5 text-sm text-neutral-300 space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral-400">Transactions</span>
            <span>{preview?.transactionCount ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Budget months</span>
            <span>{preview?.budgetMonths ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Presets</span>
            <span>{preview?.presetCount ?? '—'}</span>
          </div>
          {preview?.currency && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Currency</span>
              <span>{preview.currency}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-100 hover:bg-neutral-700 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 text-sm"
          >
            Restore
          </button>
        </div>

        <div className="mt-4 text-[11px] text-neutral-500">
          A safety backup is stored locally so you can undo this restore from Settings.
        </div>
      </div>
    </div>
  )
}
