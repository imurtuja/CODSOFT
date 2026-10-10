'use client'

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-6 sm:py-8 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-12 h-3.5 rounded skeleton-shimmer" />
          <div className="text-gray-300">/</div>
          <div className="w-20 h-3.5 rounded skeleton-shimmer" />
        </div>

        {/* Hero Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 mb-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl skeleton-shimmer shrink-0" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-40 h-6 rounded-lg skeleton-shimmer" />
                  <div className="w-24 h-5 rounded-full skeleton-shimmer" />
                </div>
                <div className="w-36 h-3.5 rounded skeleton-shimmer" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-9 rounded-xl skeleton-shimmer" />
              <div className="w-20 h-9 rounded-xl skeleton-shimmer" />
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Navigation Sidebar Skeleton */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200/90 p-3 sm:p-4 shadow-2xs space-y-2">
              <div className="w-24 h-3.5 rounded skeleton-shimmer mb-3" />
              <div className="w-full h-10 rounded-xl skeleton-shimmer" />
              <div className="w-full h-10 rounded-xl skeleton-shimmer" />
              <div className="w-full h-10 rounded-xl skeleton-shimmer" />
            </div>
          </div>

          {/* Right Column: Content Card Skeleton */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="pb-4 border-b border-gray-100 flex justify-between items-center">
              <div className="space-y-1.5">
                <div className="w-36 h-6 rounded-lg skeleton-shimmer" />
                <div className="w-56 h-3.5 rounded skeleton-shimmer" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="w-20 h-3 rounded skeleton-shimmer" />
                <div className="w-full h-10 rounded-xl skeleton-shimmer" />
              </div>
              <div className="space-y-2">
                <div className="w-20 h-3 rounded skeleton-shimmer" />
                <div className="w-full h-10 rounded-xl skeleton-shimmer" />
              </div>
              <div className="space-y-2">
                <div className="w-24 h-3 rounded skeleton-shimmer" />
                <div className="w-full h-10 rounded-xl skeleton-shimmer" />
              </div>
              <div className="space-y-2">
                <div className="w-24 h-3 rounded skeleton-shimmer" />
                <div className="w-full h-10 rounded-xl skeleton-shimmer" />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <div className="w-32 h-10 rounded-xl skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
