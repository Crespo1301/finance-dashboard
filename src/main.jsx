import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CurrencyProvider } from './context/CurrencyContext'
import { PrivacyPreferencesProvider } from './context/PrivacyPreferencesContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <CurrencyProvider>
        <PrivacyPreferencesProvider>
          <App />
        </PrivacyPreferencesProvider>
      </CurrencyProvider>
  </StrictMode>,
)
