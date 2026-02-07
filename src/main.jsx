import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CurrencyProvider } from './context/CurrencyContext'
import { PrivacyPreferencesProvider } from './context/PrivacyPreferencesContext'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <CurrencyProvider>
        <PrivacyPreferencesProvider>
          <App />
        </PrivacyPreferencesProvider>
      </CurrencyProvider>
    </ErrorBoundary>
  </StrictMode>,
)
