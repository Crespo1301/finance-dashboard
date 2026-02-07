import { Link } from 'react-router-dom'
import AdsSlot from './AdsSlot'
import { usePrivacyPreferences } from '../context/PrivacyPreferencesContext'
import { ADS_CONFIG } from '../config/adsConfig'

export default function Footer() {
  const { open } = usePrivacyPreferences()

  return (
    <footer className="mt-14 border-t border-neutral-900 pt-10 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <AdsSlot placement="footer" />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="text-neutral-500">© {new Date().getFullYear()} Finance Dashboard</div>

          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-neutral-400 hover:text-neutral-200 transition-colors">
              Privacy Policy
            </Link>

            <Link to="/settings" className="text-neutral-400 hover:text-neutral-200 transition-colors">
              Settings
            </Link>

            <button onClick={open} className="text-neutral-400 hover:text-neutral-200 transition-colors">
              Privacy Preferences
            </button>

            {ADS_CONFIG.PLACEHOLDER_MODE && <span className="text-xs text-neutral-600">Ads: placeholder</span>}
          </div>
        </div>
      </div>
    </footer>
  )
}
