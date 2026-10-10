'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const safetyTimeoutRef = useRef(null)
  const prevUrlRef = useRef('')

  const completeProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)

    setProgress(100)
    const timer = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 200)

    return () => clearTimeout(timer)
  }, [])

  const startProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)

    setVisible(true)
    setProgress(35)

    // Fluid asymptotic trickle: continuously creeps forward, NEVER gets stuck at a fixed number!
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return 96
        const remaining = 96 - prev
        const increment = Math.max(0.4, remaining * 0.15)
        return Math.min(96, prev + increment)
      })
    }, 100)

    // Safety fallback: never leave the progress bar hanging for more than 1.5s
    safetyTimeoutRef.current = setTimeout(() => {
      completeProgress()
    }, 1500)
  }, [completeProgress])

  // Trigger completion immediately when pathname or searchParams changes
  useEffect(() => {
    const currentUrl = `${pathname}?${searchParams?.toString() || ''}`
    if (prevUrlRef.current && prevUrlRef.current !== currentUrl) {
      completeProgress()
    }
    prevUrlRef.current = currentUrl
  }, [pathname, searchParams, completeProgress])

  // Intercept navigation clicks & listen for programmatic navigation events
  useEffect(() => {
    const handleNavigationStart = (e) => {
      const anchor = e.target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank' ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return
      }

      const targetUrl = new URL(anchor.href, window.location.href)
      const currentUrl = new URL(window.location.href)
      if (
        targetUrl.pathname === currentUrl.pathname &&
        targetUrl.search === currentUrl.search
      ) {
        return
      }

      startProgress()
    }

    const handleCustomStart = () => startProgress()
    const handleCustomEnd = () => completeProgress()

    document.addEventListener('click', handleNavigationStart, { capture: true })
    window.addEventListener('appNavigationStart', handleCustomStart)
    window.addEventListener('appNavigationEnd', handleCustomEnd)

    return () => {
      document.removeEventListener('click', handleNavigationStart, { capture: true })
      window.removeEventListener('appNavigationStart', handleCustomStart)
      window.removeEventListener('appNavigationEnd', handleCustomEnd)
      if (timerRef.current) clearInterval(timerRef.current)
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
    }
  }, [startProgress, completeProgress])

  if (!visible && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2.5px] z-[99999] pointer-events-none overflow-hidden transition-opacity duration-200"
      style={{ opacity: visible || progress > 0 ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-neutral-900 via-emerald-500 to-black shadow-[0_0_10px_rgba(16,185,129,0.9)] transition-all duration-150 ease-out relative"
        style={{
          width: `${progress}%`,
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        {/* Glowing live head beam: visually indicates active progress so it never looks dead */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-white/60 blur-[1px] animate-pulse" />
      </div>
    </div>
  )
}
