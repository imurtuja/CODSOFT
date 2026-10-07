import Link from 'next/link'

export default function HelpPage() {
  const faqs = [
    {
      q: 'How do I track my order?',
      a: 'Once your order is confirmed, you can track it live under the "My Orders" page in your account dashboard. We also send regular updates to your registered email.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit and debit cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, and popular digital wallets via secure Razorpay checkout.'
    },
    {
      q: 'Can I cancel or modify my order?',
      a: 'Orders can be cancelled before they are processed for shipment. Navigate to "My Orders" and select cancel, or contact customer support for urgent requests.'
    },
    {
      q: 'Do you offer international shipping?',
      a: 'Currently, EverCart ships all across India with expedited delivery options. International shipping is coming soon.'
    },
    {
      q: 'How do returns and refunds work?',
      a: 'We offer a hassle-free 7-day return policy for electronics with verified manufacturing defects or transit damages. Refunds are processed back to your original payment method.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Help Center</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find quick answers to common questions about orders, payments, shipping, and returns.
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Still need help?</h3>
          <p className="text-gray-600 mb-6">Our dedicated support team is here to assist you anytime.</p>
          <Link
            href="/contact"
            className="inline-block bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Contact Customer Support
          </Link>
        </div>
      </div>
    </div>
  )
}
