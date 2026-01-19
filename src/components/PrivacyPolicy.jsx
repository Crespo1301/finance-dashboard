function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4">Last updated: January 2026</p>
      
      <h2 className="text-xl font-semibold mb-2">Data Collection</h2>
      <p className="mb-4">
        This application stores your financial transaction data locally in your browser 
        using localStorage. This data never leaves your device and is not transmitted 
        to any server.
      </p>
      
      <h2 className="text-xl font-semibold mb-2">Advertising</h2>
      <p className="mb-4">
        We use Google AdSense to display advertisements. Google may use cookies to 
        serve ads based on your prior visits to this website or other websites. 
        You can opt out of personalized advertising by visiting 
        <a href="https://www.google.com/settings/ads" className="text-blue-500 ml-1">
          Google Ads Settings
        </a>.
      </p>
      
      <h2 className="text-xl font-semibold mb-2">Contact</h2>
      <p>For questions, contact: Crespo1301@gmail.com</p>
    </div>
  )
}

export default PrivacyPolicy
