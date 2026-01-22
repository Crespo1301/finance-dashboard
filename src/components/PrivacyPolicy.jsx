import { Link } from 'react-router-dom'

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-neutral-700 p-4 sm:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-neutral-200 hover:text-neutral-400 text-sm font-medium mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </Link>
        
        <article className="prose prose-neutral max-w-none">
          <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-200 tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-neutral-500 text-sm mb-8">Last updated: January 2026</p>
          
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-200 mb-3">Data Collection</h2>
            <p className="text-neutral-400 leading-relaxed">
              This application stores your financial transaction data locally in your browser 
              using localStorage. This data never leaves your device and is not transmitted 
              to any server. Your privacy is important to us, and we have designed this 
              application with a privacy-first approach.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-200 mb-3">Local Storage</h2>
            <p className="text-neutral-400 leading-relaxed mb-4">
              We store the following data locally on your device:
            </p>
            <ul className="space-y-2 text-neutral-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0"></span>
                <span>Your transaction history (income and expenses)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0"></span>
                <span>Budget goals and settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0"></span>
                <span>Your preferred currency</span>
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-200 mb-3">Advertising</h2>
            <p className="text-neutral-400 leading-relaxed">
              We use Google AdSense to display advertisements. Google may use cookies to 
              serve ads based on your prior visits to this website or other websites. 
              You can opt out of personalized advertising by visiting{' '}
              <a 
                href="https://www.google.com/settings/ads" 
                className="text-violet-500 hover:text-violet-700 underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ads Settings
              </a>.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-200 mb-3">Data Deletion</h2>
            <p className="text-neutral-400 leading-relaxed">
              You can delete all your data at any time by clearing your browser's localStorage 
              for this site. This will remove all transactions, budgets, and preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-200 mb-3">Third-Party Services</h2>
            <p className="text-neutral-400 leading-relaxed">
              The only third-party service integrated into this application is Google AdSense 
              for advertising purposes. We do not share any of your financial data with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-200 mb-3">Contact</h2>
            <p className="text-neutral-400 leading-relaxed">
              If you have any questions about this Privacy Policy, you can contact us through 
              GitHub at{' '}
              <a 
                href="https://github.com/Crespo1301" 
                className="text-violet-500 hover:text-violet-700 underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                @Crespo1301
              </a>.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}

export default PrivacyPolicy