import { useEffect } from 'react'

export default function RestorePreviewModal({ isOpen, onClose, onConfirm, preview }) {
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

      <div className="relative w-full sm:max-w-lg bg-neutral-950 border border-neutral-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Restore preview</h2>
            <p className="text-xs text-neutral-400 mt-1">
              This will replace your current local data in this browser. An undo backup will be created.
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
          <div className="flex justify-between">
            <span>Transactions</span>
            <span className="tabular-nums text-neutral-100">{preview?.summary?.transactionCount ?? 0}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Budget months</span>
            <span className="tabular-nums text-neutral-100">{preview?.summary?.budgetMonths ?? 0}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Presets</span>
            <span className="tabular-nums text-neutral-100">{preview?.summary?.presetCount ?? 0}</span>
          </div>
          {preview?.exportedAt && (
            <div className="flex justify-between mt-3 text-xs text-neutral-400">
              <span>Exported</span>
              <span className="tabular-nums">{preview.exportedAt}</span>
            </div>
          )}
        </div>

        {preview?.warnings?.length ? (
          <div className="mt-4 rounded-xl border border-amber-900/50 bg-amber-950/30 p-4 text-xs text-amber-200">
            <div className="font-semibold mb-2">Warnings</div>
            <ul className="list-disc pl-5 space-y-1">
              {preview.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-end gap-2">
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
            Restore now
          </button>
        </div>
      </div>
    </div>
  )
}
