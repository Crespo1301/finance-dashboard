import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/**
 * CMP-ready privacy preferences (stub)
 * - Defaults to non-essential denied
 * - Stores in localStorage
 * - Provides a persistent entry point ("Privacy Preferences") to reopen UI
 */

const STORAGE_KEY = 'privacyPreferences_v1'

const defaultPrefs = {
  hasChoice: false,
  analytics: false,
  ads: false,
  personalizedAds: false,
}

const PrivacyPreferencesContext = createContext(null)

export function PrivacyPreferencesProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return defaultPrefs
      const parsed = JSON.parse(raw)
      return { ...defaultPrefs, ...parsed }
    } catch {
      return defaultPrefs
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      // ignore
    }
  }, [prefs])

  const actions = useMemo(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      acceptAll: () =>
        setPrefs({
          hasChoice: true,
          analytics: true,
          ads: true,
          personalizedAds: true,
        }),
      rejectAll: () =>
        setPrefs({
          hasChoice: true,
          analytics: false,
          ads: false,
          personalizedAds: false,
        }),
      set: (partial) =>
        setPrefs((prev) => ({
          ...prev,
          ...partial,
          hasChoice: true,
        })),
    }),
    []
  )

  const value = useMemo(
    () => ({
      prefs,
      isOpen,
      ...actions,
      canServeAds: Boolean(prefs.ads),
      allowPersonalizedAds: Boolean(prefs.ads && prefs.personalizedAds),
    }),
    [prefs, isOpen, actions]
  )

  return (
    <PrivacyPreferencesContext.Provider value={value}>
      {children}
    </PrivacyPreferencesContext.Provider>
  )
}

export function usePrivacyPreferences() {
  const ctx = useContext(PrivacyPreferencesContext)
  if (!ctx) throw new Error('usePrivacyPreferences must be used within PrivacyPreferencesProvider')
  return ctx
}
