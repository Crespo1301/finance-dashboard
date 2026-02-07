import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-white">Terms of Use</h1>
            <p className="text-neutral-400 mt-1 text-sm">Last updated: February 7, 2026</p>
          </div>
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-100 hover:bg-neutral-700 text-sm"
          >
            ← Back
          </Link>
        </div>

        <div className="space-y-6 text-sm text-neutral-300">
          <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h2 className="text-base font-semibold text-white">1. Overview</h2>
            <p className="text-neutral-400 mt-2">
              This website provides a client-side personal finance dashboard. Your data is stored locally in
              your browser (localStorage). We do not provide financial, tax, or legal advice.
            </p>
          </section>

          <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h2 className="text-base font-semibold text-white">2. No warranties</h2>
            <p className="text-neutral-400 mt-2">
              The service is provided “as is” without warranties of any kind. You are responsible for
              verifying the accuracy of your data and any insights derived from it.
            </p>
          </section>

          <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h2 className="text-base font-semibold text-white">3. Limitation of liability</h2>
            <p className="text-neutral-400 mt-2">
              To the maximum extent permitted by law, we are not liable for any losses or damages arising
              from the use of the service, including loss of data. Use the backup feature regularly.
            </p>
          </section>

          <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h2 className="text-base font-semibold text-white">4. Privacy</h2>
            <p className="text-neutral-400 mt-2">
              Please review our <Link to="/privacy" className="text-neutral-200 underline hover:text-white">Privacy Policy</Link> for details about local storage,
              optional preferences, and advertising.
            </p>
          </section>

          <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
            <h2 className="text-base font-semibold text-white">5. Changes</h2>
            <p className="text-neutral-400 mt-2">
              We may update these terms over time. Continued use of the site after changes means you accept
              the updated terms.
            </p>
          </section>
        </div>

        <div className="mt-8 text-xs text-neutral-500">
          For questions, see the repository’s README for contact details.
        </div>
      </div>
    </div>
  )
}
