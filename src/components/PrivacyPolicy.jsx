import { Link } from 'react-router-dom'

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Privacy Policy</h1>
          <p className="mb-6 text-gray-600">Last updated: January 2026</p>
          
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Data Collection</h2>
          <p className="mb-6 text-gray-600">
            This application stores your financial transaction data locally in your browser 
            using localStorage. This data never leaves your device and is not transmitted 
            to any server. Your privacy is important to us, and we have designed this 
            application with a privacy-first approach.
          </p>
          
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Local Storage</h2>
          <p className="mb-6 text-gray-600">
            We store the following data locally on your device:
          </p>
          <ul className="list-disc list-inside mb-6 text-gray-600 space-y-1">
            <li>Your transaction history (income and expenses)</li>
            <li>Budget goals and settings</li>
            <li>Your preferred currency</li>
          </ul>
          
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Advertising</h2>
          <p className="mb-6 text-gray-600">
            We use Google AdSense to display advertisements. Google may use cookies to 
            serve ads based on your prior visits to this website or other websites. 
            You can opt out of personalized advertising by visiting{' '}
            <a 
              href="https://www.google.com/settings/ads" 
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ads Settings
            </a>.
          </p>
          
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Data Deletion</h2>
          <p className="mb-6 text-gray-600">
            You can delete all your data at any time by clearing your browser's localStorage 
            for this site. This will remove all transactions, budgets, and preferences.
          </p>
          
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Contact</h2>
          <p className="text-gray-600">
            For questions about this privacy policy, contact:{' '}
            <a 
              href="mailto:Crespo1301@gmail.com" 
              className="text-blue-600 hover:underline"
            >
              Crespo1301@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy