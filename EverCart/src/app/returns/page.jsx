import Link from 'next/link'

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Returns & Refunds</h1>
          <p className="text-gray-600">Our customer satisfaction guarantee and easy return procedure.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7-Day Replacement Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              If your product arrives damaged, defective, or significantly different from description, you are eligible for a replacement or full refund within <strong className="text-gray-900">7 days of delivery</strong>.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Eligibility Conditions</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Item must be unused and in original retail packaging with all accessories and manuals.</li>
              <li>Serial numbers, IMEI numbers, and tags must match our warehouse records.</li>
              <li>Proof of purchase (invoice or order confirmation number) must be provided.</li>
              <li>Software, downloadable media, and seal-broken hygiene items cannot be returned.</li>
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">How to Initiate a Return</h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>Go to your <Link href="/orders" className="text-blue-600 hover:underline font-medium">Orders page</Link> and select the order.</li>
              <li>Click on &ldquo;Request Return/Exchange&rdquo; and upload images or a brief video of the issue.</li>
              <li>Our verification team will review and dispatch a courier partner for free doorstep pickup.</li>
              <li>Once inspected at our hub, your replacement will be dispatched or refund initiated within 2-3 business days.</li>
            </ol>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Refund Timelines</h2>
            <p className="text-gray-600 leading-relaxed">
              Approved refunds are credited back to the original payment source (UPI, Credit/Debit card, Net Banking) within 5 to 7 business days, depending on your banking institution.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
            <Link
              href="/contact"
              className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Contact Support for Return Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
