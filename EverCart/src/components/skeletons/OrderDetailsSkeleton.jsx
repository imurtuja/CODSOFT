'use client'

export default function OrderDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-8 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-16 h-4 rounded skeleton-shimmer" />
          <div className="text-gray-300">/</div>
          <div className="w-20 h-4 rounded skeleton-shimmer" />
          <div className="text-gray-300">/</div>
          <div className="w-32 h-4 rounded skeleton-shimmer" />
        </div>

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 mb-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-36 h-6 rounded-lg skeleton-shimmer" />
                <div className="w-24 h-5 rounded-full skeleton-shimmer" />
              </div>
              <div className="w-48 h-3.5 rounded skeleton-shimmer" />
            </div>
            <div className="flex gap-2">
              <div className="w-28 h-9 rounded-xl skeleton-shimmer" />
              <div className="w-24 h-9 rounded-xl skeleton-shimmer" />
            </div>
          </div>

          {/* Shipment Progress Stepper */}
          <div className="pt-4 border-t border-gray-100">
            <div className="w-full h-2.5 rounded-full skeleton-shimmer mb-3" />
            <div className="grid grid-cols-4 gap-2">
              <div className="h-4 rounded skeleton-shimmer" />
              <div className="h-4 rounded skeleton-shimmer" />
              <div className="h-4 rounded skeleton-shimmer" />
              <div className="h-4 rounded skeleton-shimmer" />
            </div>
          </div>
        </div>

        {/* 2-Column Order Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Items List */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="w-36 h-5 rounded skeleton-shimmer" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                <div className="w-20 h-20 rounded-xl skeleton-shimmer shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-5 rounded skeleton-shimmer" />
                  <div className="w-1/4 h-4 rounded skeleton-shimmer" />
                </div>
                <div className="w-24 h-6 rounded skeleton-shimmer shrink-0" />
              </div>
            ))}
          </div>

          {/* Right: Payment & Address */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs space-y-3">
              <div className="w-28 h-5 rounded skeleton-shimmer" />
              <div className="space-y-2 pt-1">
                <div className="flex justify-between">
                  <div className="w-20 h-4 rounded skeleton-shimmer" />
                  <div className="w-16 h-4 rounded skeleton-shimmer" />
                </div>
                <div className="flex justify-between">
                  <div className="w-16 h-4 rounded skeleton-shimmer" />
                  <div className="w-12 h-4 rounded skeleton-shimmer" />
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <div className="w-20 h-5 rounded skeleton-shimmer" />
                  <div className="w-24 h-6 rounded skeleton-shimmer" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs space-y-3">
              <div className="w-32 h-5 rounded skeleton-shimmer" />
              <div className="w-40 h-4 rounded skeleton-shimmer" />
              <div className="w-3/4 h-3.5 rounded skeleton-shimmer" />
              <div className="w-1/2 h-3.5 rounded skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
