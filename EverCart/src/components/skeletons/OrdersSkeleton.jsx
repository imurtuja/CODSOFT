'use client'

export default function OrdersSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-8 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-12 h-3.5 rounded skeleton-shimmer" />
          <div className="text-gray-300">/</div>
          <div className="w-20 h-3.5 rounded skeleton-shimmer" />
        </div>

        {/* Heading Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1.5">
            <div className="w-36 h-8 rounded-xl skeleton-shimmer" />
            <div className="w-48 h-4 rounded skeleton-shimmer" />
          </div>
          <div className="w-28 h-9 rounded-xl skeleton-shimmer" />
        </div>

        {/* Orders List Skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 space-y-4 shadow-2xs"
            >
              {/* Order Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-32 h-5 rounded skeleton-shimmer" />
                  <div className="w-24 h-5 rounded-full skeleton-shimmer" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-4 rounded skeleton-shimmer" />
                  <div className="w-24 h-6 rounded skeleton-shimmer" />
                </div>
              </div>

              {/* Progress Milestones Shimmer */}
              <div className="py-2">
                <div className="w-full h-2 rounded-full skeleton-shimmer mb-2" />
                <div className="flex justify-between">
                  <div className="w-16 h-3 rounded skeleton-shimmer" />
                  <div className="w-16 h-3 rounded skeleton-shimmer" />
                  <div className="w-16 h-3 rounded skeleton-shimmer" />
                </div>
              </div>

              {/* Items Row */}
              <div className="flex items-center gap-3 pt-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-14 h-14 rounded-xl skeleton-shimmer shrink-0" />
                ))}
                <div className="space-y-1.5 ml-2 flex-1">
                  <div className="w-48 h-4 rounded skeleton-shimmer" />
                  <div className="w-24 h-3.5 rounded skeleton-shimmer" />
                </div>
                <div className="w-28 h-9 rounded-xl skeleton-shimmer shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
