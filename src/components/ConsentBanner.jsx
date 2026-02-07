import { useMemo } from 'react'
import { usePrivacyPreferences } from '../context/PrivacyPreferencesContext'

export default function ConsentBanner() {
  const { prefs, open, acceptAll, rejectAll } = usePrivacyPreferences()
  const shouldShow = useMemo(() => !prefs.hasChoice, [prefs.hasChoice])
  if (!shouldShow) return null

  return (
    <div className="fixed bottom-3 left-3 right-3 z-40">
      <div className="max-w-3xl mx-auto bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">We respect your privacy</div>
            <div className="text-xs text-neutral-400 mt-1">
              This app uses localStorage to save your data. Optional analytics and ads can support the free service.
              Choose your preferences anytime.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
            <button onClick={open} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-100 hover:bg-neutral-700 text-sm">
              Manage
            </button>
            <button onClick={rejectAll} className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-100 hover:bg-neutral-700 text-sm">
              Reject
            </button>
            <button onClick={acceptAll} className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-sm">
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
