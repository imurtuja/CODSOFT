'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ProductDetailSkeleton() {
  const [preview] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      const pid = window.location.pathname.split('/').pop()
      if (pid) {
        const cached = sessionStorage.getItem(`evercart_preview_${pid}`)
        if (cached) return JSON.parse(cached)
      }
    } catch (e) {}
    return null
  })

  if (preview) {
    const imageUrl = preview.images?.[0] || preview.image || ''
    return (
      <div className="min-h-screen bg-white py-8 animate-in fade-in duration-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Preview */}
          <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
            <span>Home</span>
            <span>/</span>
            <span className="capitalize">{preview.category || 'Product'}</span>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">{preview.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12 items-start justify-between">
            {/* Gallery Stage */}
            <div className="w-full lg:w-[45%] shrink-0">
              <div className="w-full h-[400px] sm:h-[480px] lg:h-[68vh] min-h-[460px] max-h-[720px] rounded-2xl bg-gray-50/70 border border-gray-100 flex items-center justify-center p-6 relative overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={preview.name || 'Product'}
                    width={500}
                    height={500}
                    className="max-h-full max-w-full object-contain"
                    priority
                  />
                ) : (
                  <div className="w-full h-full skeleton-shimmer" />
                )}
              </div>
            </div>

            {/* Info Preview */}
            <div className="w-full lg:w-[55%] min-w-0 flex-1 space-y-4 sm:space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-black bg-gray-100 px-3 py-1 rounded-full">
                  {preview.brand || 'Brand'}
                </span>
                <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  {preview.category || 'Category'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                {preview.name}
              </h1>

              {preview.price && (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                      ₹{preview.price.toLocaleString('en-IN')}
                    </span>
                    {preview.originalPrice && preview.originalPrice > preview.price && (
                      <span className="text-lg text-gray-400 line-through">
                        ₹{preview.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Shimmer placeholders for full specs & buttons while stream completes */}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <div className="h-11 rounded-xl skeleton-shimmer" />
                <div className="h-11 rounded-xl skeleton-shimmer" />
              </div>
              <div className="pt-4 space-y-2">
                <div className="h-4 rounded skeleton-shimmer w-3/4" />
                <div className="h-4 rounded skeleton-shimmer w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-12 h-3.5 rounded skeleton-shimmer" />
          <div className="text-gray-300">/</div>
          <div className="w-16 h-3.5 rounded skeleton-shimmer" />
          <div className="text-gray-300">/</div>
          <div className="w-28 h-3.5 rounded skeleton-shimmer" />
        </div>

        {/* 2-Column Product Layout Skeleton (45% Gallery / 55% Details) */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12 items-start justify-between">
          {/* Left: Gallery Column Skeleton (45% Width) */}
          <div className="w-full lg:w-[45%] shrink-0">
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 items-start">
              {/* Left thumbnail column */}
              <div className="flex sm:flex-col gap-2.5 shrink-0 w-full sm:w-[68px] lg:w-[72px]">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-14 h-14 sm:w-[68px] sm:h-[68px] lg:w-[72px] lg:h-[72px] rounded-xl border border-gray-100 skeleton-shimmer shrink-0"
                  />
                ))}
              </div>

              {/* Main Stage Image Skeleton (Directly rounded, 65-70% screen height) */}
              <div className="flex-1 w-full min-w-0">
                <div className="w-full h-[400px] sm:h-[480px] lg:h-[68vh] min-h-[460px] max-h-[720px] rounded-2xl skeleton-shimmer relative overflow-hidden" />
              </div>
            </div>
          </div>

          {/* Right: Info & Purchase Column (55% Width) */}
          <div className="w-full lg:w-[55%] min-w-0 flex-1 space-y-4 sm:space-y-5">
            {/* Category / Brand Pill */}
            <div className="flex items-center gap-2">
              <div className="w-20 h-5 rounded-full skeleton-shimmer" />
              <div className="w-24 h-5 rounded-full skeleton-shimmer" />
            </div>

            {/* Title (2 lines) */}
            <div className="space-y-2">
              <div className="w-11/12 h-7 rounded-lg skeleton-shimmer" />
              <div className="w-3/4 h-7 rounded-lg skeleton-shimmer" />
            </div>

            {/* Rating Badge (Stock & genuine badge kept clean/private) */}
            <div className="flex items-center gap-3">
              <div className="w-24 h-6 rounded-md skeleton-shimmer" />
            </div>

            {/* Price (Unboxed) */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <div className="w-36 h-9 rounded-lg skeleton-shimmer" />
                <div className="w-20 h-5 rounded skeleton-shimmer" />
                <div className="w-16 h-5 rounded-full skeleton-shimmer" />
              </div>
              <div className="w-52 h-3.5 rounded skeleton-shimmer" />
            </div>

            {/* Action Buttons Skeleton (Single line, 2-column grid) */}
            <div className="pt-1 grid grid-cols-2 gap-3">
              <div className="h-11 rounded-xl skeleton-shimmer" />
              <div className="h-11 rounded-xl skeleton-shimmer" />
            </div>

            {/* Interactive Clean Sections Skeleton */}
            <div className="pt-2 divide-y divide-gray-100 border-t border-gray-100">
              {/* Features Accordion Skeleton */}
              <div className="py-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded skeleton-shimmer shrink-0" />
                    <div className="w-28 h-5 rounded skeleton-shimmer" />
                    <div className="w-20 h-5 rounded-full skeleton-shimmer" />
                  </div>
                  <div className="w-7 h-7 rounded-full skeleton-shimmer" />
                </div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded skeleton-shimmer shrink-0" />
                      <div className={`h-4 rounded skeleton-shimmer ${i % 2 === 0 ? 'w-5/6' : 'w-3/4'}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Specs Accordion Skeleton */}
              <div className="py-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded skeleton-shimmer shrink-0" />
                    <div className="w-36 h-5 rounded skeleton-shimmer" />
                    <div className="w-16 h-5 rounded-full skeleton-shimmer" />
                  </div>
                  <div className="w-7 h-7 rounded-full skeleton-shimmer" />
                </div>
                <div className="divide-y divide-gray-100">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="py-3 flex justify-between gap-4">
                      <div className="w-24 h-4 rounded skeleton-shimmer" />
                      <div className="w-48 h-4 rounded skeleton-shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
