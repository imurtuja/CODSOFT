export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: October 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10 space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>
              When you visit or purchase from EverCart, we collect device information (browser type, IP address, cookies) and order information (name, billing address, shipping address, email address, phone number). Payment details are securely processed via certified PCI-DSS compliant partners and never stored on our servers.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p>
              We use the collected information to fulfill orders, process payments, arrange delivery, communicate order status, screen transactions for risk and fraud, and deliver relevant promotions according to your preferences.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Sharing and Third Parties</h2>
            <p>
              We share your information solely with trusted third-party service providers who assist our operations - such as logistics carriers, cloud hosting providers, and payment processors. We never sell, rent, or trade your personal data to marketing third parties.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Security of Your Information</h2>
            <p>
              We implement industry-standard AES encryption, HTTPS secure connections, and strict access controls to protect your personal details against unauthorized access, loss, or disclosure.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Contact Regarding Privacy</h2>
            <p>
              If you have any questions or wish to request data deletion under applicable data protection regulations, please contact our privacy compliance officer at <strong className="text-gray-900">privacy@evercart.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
