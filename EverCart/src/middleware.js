import { NextResponse } from 'next/server'

export function middleware(request) {
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
      return NextResponse.rewrite(new URL('/admin', request.url))
    }

    // 2. Explicit '/admin' on admin subdomain redirects cleanly to root '/'
    if (pathname === '/admin' || pathname === '/admin/') {
      const cleanUrl = new URL('/', request.url)
      cleanUrl.search = request.nextUrl.search
      return NextResponse.redirect(cleanUrl)
    }

    // 3. ANY OTHER PAGE on admin subdomain (e.g. /category/electronics, /products, /cart, /checkout, etc.)
    // admin.evercart.murtuja.in is ONLY for the admin page!
    // Redirect all storefront requests back to the main domain.
    const targetMainUrl = new URL(pathname, mainOrigin)
    targetMainUrl.search = request.nextUrl.search
    return NextResponse.redirect(targetMainUrl)
  }

  // On the main domain (e.g. evercart.murtuja.in or localhost:3000):
  // If someone directly visits /admin, redirect them to the admin subdomain root
  if (pathname === '/admin' || pathname === '/admin/' || pathname.startsWith('/admin/')) {
    const redirectUrl = new URL('/', adminOrigin)
    redirectUrl.search = request.nextUrl.search
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
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
