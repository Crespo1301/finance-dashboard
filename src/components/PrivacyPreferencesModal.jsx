import { useEffect, useRef } from 'react'
import { usePrivacyPreferences } from '../context/PrivacyPreferencesContext'
import useFocusTrap from '../utils/useFocusTrap'

function ToggleRow({ label, description, checked, onChange, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-medium text-neutral-100">{label}</div>
        <div className="text-xs text-neutral-400 mt-1">{description}</div>
      </div>

      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        aria-pressed={checked}
        disabled={disabled}
        className={[
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
          checked ? 'bg-emerald-500' : 'bg-neutral-700',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

export default function PrivacyPreferencesModal() {
  const { prefs, isOpen, close, acceptAll, rejectAll, set } = usePrivacyPreferences()
  const dialogRef = useRef(null)

  // Trap focus while open (safe/no-op until ref exists)
  useFocusTrap(dialogRef, isOpen)

  // Escape to close
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close])

  if (!isOpen) return null

  const onSave = () => close()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Privacy preferences"
    >
      <button
        className="absolute inset-0 bg-black/60"
        aria-label="Close privacy preferences"
        onClick={close}
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full sm:max-w-lg bg-neutral-950 border border-neutral-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Privacy Preferences</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Choose which categories you allow. You can change these anytime.
            </p>
          </div>
          <button onClick={close} className="text-neutral-400 hover:text-neutral-200" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mt-5 divide-y divide-neutral-800">
          <ToggleRow
            label="Necessary"
            description="Required for the app to function (localStorage, basic settings). Always on."
            checked
            disabled
            onChange={() => {}}
          />

          <ToggleRow
            label="Analytics"
            description="Helps us understand usage and improve the product (optional)."
            checked={prefs.analytics}
            onChange={(v) => set({ analytics: v })}
          />

          <ToggleRow
            label="Ads"
            description="Allows showing ads to support the free app."
            checked={prefs.ads}
            onChange={(v) => set({ ads: v, personalizedAds: v ? prefs.personalizedAds : false })}
          />

          <ToggleRow
            label="Personalized ads"
            description="Uses your data for personalization and measurement (optional)."
            checked={prefs.personalizedAds}
            disabled={!prefs.ads}
            onChange={(v) => set({ personalizedAds: v })}
          />
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={rejectAll}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-100 hover:bg-neutral-700 text-sm"
            >
              Reject
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-sm"
            >
              Accept all
            </button>
          </div>

          <button
            onClick={onSave}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 text-sm"
          >
            Save
          </button>
        </div>

        <div className="mt-4 text-[11px] text-neutral-500">
          For EEA/UK/Switzerland traffic, AdSense requires a Google-certified CMP integrated with IAB TCF.
          This UI is a stub that keeps the app stable until a CMP is added.
        </div>
      </div>
    </div>
  )
}
