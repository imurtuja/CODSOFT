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
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: CORS_HEADERS,
    })
  }

  const host = request.headers.get('host') || request.nextUrl.host || ''
  const { pathname } = request.nextUrl

  // Detect admin subdomain
  const isAdminSubdomain = host.startsWith('admin.') || host.includes('admin.evercart')

  // Resolve storefront origin
  let mainOrigin = 'https://evercart.murtuja.in'
  if (host.includes('localhost')) {
    const protocol = request.nextUrl.protocol || 'http:'
    mainOrigin = `${protocol}//${host.replace(/^admin\./, '')}`
  } else if (host.startsWith('admin.')) {
    const protocol = request.nextUrl.protocol || 'https:'
    mainOrigin = `${protocol}//${host.replace(/^admin\./, '')}`
  }

  // Resolve admin origin
  let adminOrigin = 'https://admin.evercart.murtuja.in'
  if (host.includes('localhost')) {
    const protocol = request.nextUrl.protocol || 'http:'
    const cleanHost = host.replace(/^admin\./, '')
    adminOrigin = `${protocol}//admin.${cleanHost}`
  }

  if (isAdminSubdomain) {
    // Rewrite root path to internal /admin route on admin host
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

    // Normalize explicit /admin to root
    if (pathname === '/admin' || pathname === '/admin/') {
      const cleanUrl = new URL('/', request.url)
      cleanUrl.search = request.nextUrl.search
      const response = NextResponse.redirect(cleanUrl)
      Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
      return response
    }

    // Respond with 204 for cross-origin RSC prefetch probes on admin host
    const isRsc = request.nextUrl.searchParams.has('_rsc') || 
                  request.headers.has('rsc') || 
                  request.headers.has('next-router-prefetch')
    if (isRsc) {
      return new NextResponse(null, {
        status: 204,
        headers: CORS_HEADERS,
      })
    }

    // Redirect storefront routes requested on admin subdomain back to storefront
    const targetMainUrl = new URL(pathname, mainOrigin)
    targetMainUrl.search = request.nextUrl.search
    const response = NextResponse.redirect(targetMainUrl)
    Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
    return response
  }

  // Redirect /admin on storefront to admin subdomain
  if (pathname === '/admin' || pathname === '/admin/' || pathname.startsWith('/admin/')) {
    const redirectUrl = new URL('/', adminOrigin)
    redirectUrl.search = request.nextUrl.search
    const response = NextResponse.redirect(redirectUrl)
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
