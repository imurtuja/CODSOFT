'use client'

export default function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-8 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-12 h-3.5 rounded skeleton-shimmer" />
          <div className="text-gray-300">/</div>
          <div className="w-12 h-3.5 rounded skeleton-shimmer" />
          <div className="text-gray-300">/</div>
          <div className="w-20 h-3.5 rounded skeleton-shimmer" />
        </div>

        {/* Header with stepper skeleton */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-gray-200">
            <div className="space-y-2">
              <div className="w-48 h-8 rounded-xl skeleton-shimmer" />
              <div className="w-36 h-4 rounded skeleton-shimmer" />
            </div>
            <div className="w-52 h-7 rounded-full skeleton-shimmer" />
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-6 max-w-3xl">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="p-3 sm:p-4 rounded-xl border border-gray-200 bg-white shadow-2xs flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-lg skeleton-shimmer shrink-0" />
                  <div className="space-y-1.5 flex-1 hidden sm:block">
                    <div className="w-20 h-3.5 rounded skeleton-shimmer" />
                    <div className="w-28 h-2.5 rounded skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form column skeleton */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6 sm:p-7 space-y-6">
            <div className="pb-5 border-b border-gray-100 flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="w-44 h-6 rounded-lg skeleton-shimmer" />
                <div className="w-64 h-3.5 rounded skeleton-shimmer" />
              </div>
              <div className="w-28 h-4 rounded skeleton-shimmer" />
            </div>

            {/* Saved Address Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="w-24 h-4 rounded skeleton-shimmer" />
                <div className="w-36 h-4 rounded skeleton-shimmer" />
                <div className="w-48 h-3 rounded skeleton-shimmer" />
                <div className="w-32 h-3 rounded skeleton-shimmer" />
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="w-24 h-4 rounded skeleton-shimmer" />
                <div className="w-36 h-4 rounded skeleton-shimmer" />
                <div className="w-48 h-3 rounded skeleton-shimmer" />
                <div className="w-32 h-3 rounded skeleton-shimmer" />
              </div>
            </div>

            {/* Action Button Skeleton */}
            <div className="pt-5 border-t border-gray-100 flex justify-end">
              <div className="w-44 h-11 rounded-xl skeleton-shimmer" />
            </div>
          </div>

          {/* Order summary skeleton */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div className="w-24 h-5 rounded skeleton-shimmer" />
                <div className="w-14 h-4 rounded-full skeleton-shimmer" />
              </div>

              <div className="space-y-3 py-2">
                <div className="flex justify-between">
                  <div className="w-20 h-4 rounded skeleton-shimmer" />
                  <div className="w-16 h-4 rounded skeleton-shimmer" />
                </div>
                <div className="flex justify-between">
                  <div className="w-28 h-4 rounded skeleton-shimmer" />
                  <div className="w-12 h-4 rounded skeleton-shimmer" />
                </div>
                <div className="flex justify-between">
                  <div className="w-24 h-4 rounded skeleton-shimmer" />
                  <div className="w-20 h-4 rounded skeleton-shimmer" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between">
                <div className="w-20 h-6 rounded skeleton-shimmer" />
                <div className="w-24 h-6 rounded skeleton-shimmer" />
              </div>
            </div>

            {/* Trust Badges Skeleton */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs space-y-3">
              <div className="w-full h-8 rounded-lg skeleton-shimmer" />
              <div className="w-full h-8 rounded-lg skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
