import Link from 'next/link'

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Shipping Information</h1>
          <p className="text-gray-600">Everything you need to know about our fast, insured delivery process.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Standard Delivery Timelines</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We process and ship all orders within 24 hours of placement. Typical delivery times depend on your location:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-semibold text-gray-900">Metro Cities</p>
                <p className="text-2xl font-bold text-blue-600 my-1">1 - 2 Days</p>
                <p className="text-xs text-gray-500">Delhi, Mumbai, Bengaluru, etc.</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-semibold text-gray-900">Tier 2 & 3 Cities</p>
                <p className="text-2xl font-bold text-blue-600 my-1">3 - 5 Days</p>
                <p className="text-xs text-gray-500">Major towns and districts</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-semibold text-gray-900">Remote Areas</p>
                <p className="text-2xl font-bold text-blue-600 my-1">5 - 7 Days</p>
                <p className="text-xs text-gray-500">Special courier routes</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Shipping Rates</h2>
            <p className="text-gray-600 leading-relaxed">
              We offer <strong className="text-gray-900">Free Express Shipping</strong> on all prepaid orders across the nation. For orders below specified promotional thresholds or cash on delivery, standard flat shipping rates apply at checkout.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Packaging & Insurance</h2>
            <p className="text-gray-600 leading-relaxed">
              All electronic devices and fragile items are packed in shock-resistant tamper-evident boxes with multi-layer bubble wrap. Shipments are fully insured against loss or damage during transit until delivered to your doorstep.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">Need specific tracking details for an existing package?</p>
            <Link
              href="/orders"
              className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
