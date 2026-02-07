import { useEffect, useMemo } from 'react'
import { ADS_CONFIG } from '../config/adsConfig'
import { usePrivacyPreferences } from '../context/PrivacyPreferencesContext'

const ensureAdSenseScript = (clientId) => {
  if (!clientId || clientId.includes('XXXXXXXX')) return false
  const existing = document.querySelector('script[data-adsense="true"]')
  if (existing) return true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
    clientId
  )}`
  script.crossOrigin = 'anonymous'
  script.dataset.adsense = 'true'
  document.head.appendChild(script)
  return true
}

function Placeholder({ label = 'Sponsored' }) {
  return (
    <div className="w-full h-full rounded-xl border border-neutral-800 bg-neutral-900 flex items-center justify-center">
      <div className="text-xs text-neutral-500">{label} (placeholder)</div>
    </div>
  )
}

export default function AdsSlot({ placement, className = '' }) {
  const { prefs, canServeAds, allowPersonalizedAds } = usePrivacyPreferences()
  const slot = ADS_CONFIG.SLOTS?.[placement]
  const minHeight = slot?.minHeight ?? 180

  const shouldRenderRealAd =
    ADS_CONFIG.ADS_ENABLED && canServeAds && !ADS_CONFIG.ADSENSE_CLIENT.includes('XXXXXXXX')

  useEffect(() => {
    if (!shouldRenderRealAd) return
    const ok = ensureAdSenseScript(ADS_CONFIG.ADSENSE_CLIENT)
    if (!ok) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.warn('AdSense push error:', e)
    }
  }, [shouldRenderRealAd])

  const containerStyle = useMemo(() => ({ minHeight }), [minHeight])
  const showPlaceholder = ADS_CONFIG.PLACEHOLDER_MODE && !shouldRenderRealAd

  return (
    <div className={`w-full ${className}`} style={containerStyle} aria-label={slot?.label || 'Advertisement'}>
      {showPlaceholder ? (
        <Placeholder label={slot?.label} />
      ) : shouldRenderRealAd ? (
        <div className="w-full h-full">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '100%' }}
            data-ad-client={ADS_CONFIG.ADSENSE_CLIENT}
            data-ad-slot={slot?.adSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
            {...(!allowPersonalizedAds ? { 'data-npa': '1' } : {})}
          />
        </div>
      ) : (
        <div className="w-full h-full" />
      )}

      <div className="mt-2 text-[11px] text-neutral-500 text-center">
        {slot?.label || 'Sponsored'}
        {!prefs.hasChoice && ' (ads not loaded until you choose)'}
      </div>
    </div>
  )
}
