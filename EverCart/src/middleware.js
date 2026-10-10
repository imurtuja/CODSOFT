import { NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization, rsc, next-router-state-tree, next-router-prefetch, next-url',
  'Access-Control-Expose-Headers': 'request-id, x-rtb-fingerprint-id',
  'Access-Control-Max-Age': '86400',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), otp-credentials=*',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
}

export function middleware(request) {
  // Handle CORS preflight requests immediately
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: CORS_HEADERS,
    })
  }

  const host = request.headers.get('host') || request.nextUrl.host || ''
  const { pathname } = request.nextUrl

  // Check if current domain is an admin subdomain (e.g. admin.evercart.murtuja.in or admin.localhost:3000)
  const isAdminSubdomain = host.startsWith('admin.') || host.includes('admin.evercart')

  // Resolve main storefront origin
  let mainOrigin = 'https://evercart.murtuja.in'
  if (host.includes('localhost')) {
    const protocol = request.nextUrl.protocol || 'http:'
    mainOrigin = `${protocol}//${host.replace(/^admin\./, '')}`
  } else if (host.startsWith('admin.')) {
    const protocol = request.nextUrl.protocol || 'https:'
    mainOrigin = `${protocol}//${host.replace(/^admin\./, '')}`
  }

  // Resolve admin subdomain origin
  let adminOrigin = 'https://admin.evercart.murtuja.in'
  if (host.includes('localhost')) {
    const protocol = request.nextUrl.protocol || 'http:'
    const cleanHost = host.replace(/^admin\./, '')
    adminOrigin = `${protocol}//admin.${cleanHost}`
  }

  if (isAdminSubdomain) {
    // 1. Root path '/' on admin subdomain renders the Admin Dashboard
    // The browser URL remains admin.evercart.murtuja.in without /admin
    if (pathname === '/') {
      const reqHeaders = new Headers(request.headers)
      reqHeaders.set('x-is-admin', 'true')
      const response = NextResponse.rewrite(new URL('/admin', request.url), {
        request: {
          headers: reqHeaders,
        },
      })
      Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
      return response
    }

    // 2. Explicit '/admin' on admin subdomain redirects cleanly to root '/'
    if (pathname === '/admin' || pathname === '/admin/') {
      const cleanUrl = new URL('/', request.url)
      cleanUrl.search = request.nextUrl.search
      const response = NextResponse.redirect(cleanUrl)
      Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
      return response
    }

    // 3. Next.js internal RSC payload / prefetch fetch requests for non-root routes on admin:
    // Do NOT redirect an RSC fetch across origins! A cross-origin redirected RSC fetch triggers
    // browser CORS violations and breaks router prefetching. Return a clean 204 response.
    const isRsc = request.nextUrl.searchParams.has('_rsc') || 
                  request.headers.has('rsc') || 
                  request.headers.has('next-router-prefetch')
    if (isRsc) {
      return new NextResponse(null, {
        status: 204,
        headers: CORS_HEADERS,
      })
    }

    // 4. ANY OTHER PAGE on admin subdomain (e.g. /category/electronics, /products, /cart, /checkout, etc.)
    // admin.evercart.murtuja.in is ONLY for the admin page!
    // Redirect normal browser navigation back to the main domain.
    const targetMainUrl = new URL(pathname, mainOrigin)
    targetMainUrl.search = request.nextUrl.search
    const response = NextResponse.redirect(targetMainUrl)
    Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
    return response
  }

  // On the main domain:
  if (pathname === '/admin' || pathname === '/admin/' || pathname.startsWith('/admin/')) {
    if (!host.includes('localhost')) {
      const redirectUrl = new URL('/', adminOrigin)
      redirectUrl.search = request.nextUrl.search
      const response = NextResponse.redirect(redirectUrl)
      Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
      return response
    }

    // On localhost, allow direct /admin access with x-is-admin header
    const reqHeaders = new Headers(request.headers)
    reqHeaders.set('x-is-admin', 'true')
    const response = NextResponse.next({
      request: {
        headers: reqHeaders,
      },
    })
    Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
    return response
  }

  const response = NextResponse.next()
  Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
