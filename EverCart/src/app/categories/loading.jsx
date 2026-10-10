'use client'

export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-8 animate-in fade-in duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-12 h-3.5 rounded skeleton-shimmer" />
          <div className="text-gray-300">/</div>
          <div className="w-20 h-3.5 rounded skeleton-shimmer" />
        </div>

        {/* Page Header */}
        <div className="pb-6 border-b border-gray-200 mb-8 space-y-2">
          <div className="w-48 h-8 rounded-xl skeleton-shimmer" />
          <div className="w-80 h-4 rounded skeleton-shimmer" />
        </div>

        {/* Categories Grid Skeleton (6 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
                <div className="w-24 h-5 rounded-lg skeleton-shimmer" />
              </div>
              <div className="space-y-2">
                <div className="w-32 h-5 rounded skeleton-shimmer" />
                <div className="w-48 h-3.5 rounded skeleton-shimmer" />
              </div>
              <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                <div className="w-20 h-3 rounded skeleton-shimmer" />
                <div className="w-4 h-4 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
