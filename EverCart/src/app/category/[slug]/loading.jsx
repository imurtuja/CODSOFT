'use client'

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-8 animate-in fade-in duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-12 h-3.5 rounded skeleton-shimmer" />
          <div className="text-gray-300">/</div>
          <div className="w-16 h-3.5 rounded skeleton-shimmer" />
          <div className="text-gray-300">/</div>
          <div className="w-24 h-3.5 rounded skeleton-shimmer" />
        </div>

        {/* Hero Heading Skeleton */}
        <div className="mb-8 space-y-2">
          <div className="w-48 h-8 rounded-xl skeleton-shimmer" />
          <div className="w-72 h-4 rounded skeleton-shimmer" />
        </div>

        {/* Filters Bar Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xs">
          <div className="w-36 h-4 rounded skeleton-shimmer" />
          <div className="flex gap-3">
            <div className="w-28 h-9 rounded-lg skeleton-shimmer" />
            <div className="w-36 h-9 rounded-lg skeleton-shimmer" />
          </div>
        </div>

        {/* Products Display Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs flex flex-col justify-between h-[390px]"
            >
              <div>
                <div className="w-full aspect-square rounded-xl skeleton-shimmer mb-4" />
                <div className="h-3.5 rounded-full skeleton-shimmer w-1/3 mb-2.5" />
                <div className="h-5 rounded-lg skeleton-shimmer w-3/4 mb-3" />
                <div className="h-6 rounded-lg skeleton-shimmer w-1/2 mb-4" />
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <div className="h-9 rounded-xl skeleton-shimmer flex-1" />
                <div className="h-9 rounded-xl skeleton-shimmer flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
