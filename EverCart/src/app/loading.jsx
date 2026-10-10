'use client'

export default function RootLoading() {
  return (
    <div className="min-h-[85vh] bg-gray-50/50 py-8 animate-in fade-in duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top breadcrumb / title shimmer */}
        <div className="space-y-3">
          <div className="w-32 h-4 rounded skeleton-shimmer" />
          <div className="w-64 h-8 rounded-xl skeleton-shimmer" />
        </div>

        {/* Content grid shimmer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs space-y-4 h-[380px]"
            >
              <div className="w-full h-44 rounded-xl skeleton-shimmer" />
              <div className="w-20 h-3.5 rounded-full skeleton-shimmer" />
              <div className="w-3/4 h-5 rounded-lg skeleton-shimmer" />
              <div className="w-1/2 h-4 rounded skeleton-shimmer" />
              <div className="pt-4 flex gap-2">
                <div className="flex-1 h-9 rounded-xl skeleton-shimmer" />
                <div className="w-16 h-9 rounded-xl skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
