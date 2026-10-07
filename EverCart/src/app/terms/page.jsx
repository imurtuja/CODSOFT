export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-gray-600">Last updated: October 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10 space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using EverCart, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. User Accounts</h2>
            <p>
              When you create an account with us, you must provide accurate and complete information. You are solely responsible for maintaining the confidentiality of your account credentials and password.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Products and Pricing</h2>
            <p>
              We strive for precision in product images, descriptions, and pricing. However, errors may occasionally occur. EverCart reserves the right to correct errors, update information, or cancel orders containing erroneous price information prior to shipment.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Limitation of Liability</h2>
            <p>
              In no event shall EverCart or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our products or services.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the applicable laws of India, without regard to its conflict of law provisions.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
