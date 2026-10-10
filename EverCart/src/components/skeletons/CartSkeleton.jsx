'use client'

export default function CartSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-8 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-12 h-3.5 rounded skeleton-shimmer" />
          <div className="text-gray-300">/</div>
          <div className="w-16 h-3.5 rounded skeleton-shimmer" />
        </div>

        {/* Heading Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <div className="w-44 h-8 rounded-xl skeleton-shimmer" />
            <div className="w-28 h-4 rounded skeleton-shimmer" />
          </div>
          <div className="w-24 h-8 rounded-lg skeleton-shimmer" />
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Cart Items List */}
          <div className="lg:col-span-8 space-y-3">
            {[...Array(3)].map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4"
              >
                {/* Product Image Thumbnail */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl skeleton-shimmer shrink-0" />

                {/* Details */}
                <div className="flex-1 w-full space-y-2">
                  <div className="w-20 h-4 rounded-full skeleton-shimmer" />
                  <div className="w-3/4 h-5 rounded-lg skeleton-shimmer" />
                  <div className="w-1/3 h-4 rounded skeleton-shimmer" />

                  <div className="pt-2 flex items-center justify-between">
                    <div className="w-24 h-6 rounded-lg skeleton-shimmer" />
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-8 rounded-lg skeleton-shimmer" />
                      <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Order Summary Sidebar */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 space-y-4">
              <div className="w-32 h-6 rounded-lg skeleton-shimmer" />

              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between">
                  <div className="w-20 h-4 rounded skeleton-shimmer" />
                  <div className="w-16 h-4 rounded skeleton-shimmer" />
                </div>
                <div className="flex justify-between">
                  <div className="w-16 h-4 rounded skeleton-shimmer" />
                  <div className="w-12 h-4 rounded skeleton-shimmer" />
                </div>
                <div className="flex justify-between">
                  <div className="w-24 h-4 rounded skeleton-shimmer" />
                  <div className="w-14 h-4 rounded skeleton-shimmer" />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <div className="w-24 h-5 rounded skeleton-shimmer" />
                <div className="w-28 h-7 rounded-lg skeleton-shimmer" />
              </div>

              <div className="w-full h-11 rounded-xl skeleton-shimmer pt-2" />
              <div className="w-3/4 h-3.5 mx-auto rounded skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
