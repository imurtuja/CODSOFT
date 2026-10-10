'use client'

export default function HomeScreenSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/40 animate-pulse">
      {/* Hero section skeleton */}
      <section className="bg-gradient-to-b from-gray-50 via-white to-gray-50/60 border-b border-gray-200/80 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge Shimmer */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-200/80 w-52 h-7" />

              {/* Headings */}
              <div className="space-y-3 max-w-xl mx-auto lg:mx-0">
                <div className="h-10 sm:h-12 lg:h-14 bg-gray-200 rounded-2xl w-full" />
                <div className="h-10 sm:h-12 lg:h-14 bg-gray-200/70 rounded-2xl w-4/5" />
              </div>

              {/* Subtitle Paragraph */}
              <div className="space-y-2 max-w-2xl mx-auto lg:mx-0 pt-1">
                <div className="h-4 bg-gray-200/80 rounded w-full" />
                <div className="h-4 bg-gray-200/80 rounded w-11/12" />
                <div className="h-4 bg-gray-200/60 rounded w-2/3" />
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start pt-3">
                <div className="h-12 w-44 bg-gray-900/10 rounded-xl" />
                <div className="h-12 w-48 bg-gray-200/80 rounded-xl" />
              </div>

              {/* Trust Metrics */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200/80 max-w-md mx-auto lg:mx-0">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-7 bg-gray-300 rounded-lg w-16" />
                    <div className="h-3.5 bg-gray-200 rounded w-24" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Spotlight Card Skeleton */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm">
                {/* Image Placeholder */}
                <div className="relative w-full h-80 sm:h-92 bg-gray-200">
                  <div className="absolute top-4 left-4 w-28 h-6 rounded-full bg-gray-300/80" />
                  <div className="absolute top-4 right-4 w-14 h-6 rounded-full bg-gray-300/80" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent via-white/80 to-white" />
                </div>

                {/* Card Content Placeholder */}
                <div className="relative -mt-20 sm:-mt-24 px-6 pb-6 pt-0 space-y-3 z-10">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-32 bg-gray-200 rounded-full" />
                  </div>

                  <div className="h-6 bg-gray-300 rounded-lg w-4/5" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                      <div className="h-7 w-28 bg-gray-300 rounded-lg" />
                    </div>
                    <div className="h-10 w-32 bg-gray-900/10 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust features skeleton */}
      <section className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-gray-200 rounded w-28" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Department navigation skeleton */}
      <section className="py-12 sm:py-16 bg-gray-50/50 border-b border-gray-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-2">
            <div className="h-7 w-56 bg-gray-300 rounded-lg" />
            <div className="h-4 w-72 bg-gray-200 rounded" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                <div className="h-4 bg-gray-300 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured highlights skeleton */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 w-60 bg-gray-300 rounded-lg" />
              <div className="h-4 w-80 bg-gray-200 rounded" />
            </div>
            <div className="h-5 w-24 bg-gray-200 rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200/80 p-4 space-y-3">
                <div className="w-full h-48 bg-gray-100 rounded-xl" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-5 w-full bg-gray-300 rounded-lg" />
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
                <div className="pt-2 flex items-center justify-between">
                  <div className="h-6 w-24 bg-gray-300 rounded" />
                  <div className="h-9 w-24 bg-gray-900/10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
