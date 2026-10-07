import { NextResponse } from 'next/server'

export function middleware(request) {
  const host = request.headers.get('host') || request.nextUrl.host || ''
  const { pathname } = request.nextUrl

  // Check if current domain is an admin subdomain (e.g. admin.evercart.murtuja.in or admin.localhost:3000)
  const isAdminSubdomain = host.startsWith('admin.') || host.includes('admin.evercart')

  if (isAdminSubdomain) {
    // If accessing root '/' on admin subdomain, rewrite internally to /admin page
    // The browser URL remains admin.evercart.murtuja.in without showing /admin
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', request.url))
    }

    // If accessing '/admin' explicitly on admin subdomain, redirect cleanly to root '/'
    if (pathname === '/admin' || pathname === '/admin/') {
      const cleanUrl = new URL('/', request.url)
      cleanUrl.search = request.nextUrl.search
      return NextResponse.redirect(cleanUrl)
    }

    // Allow all other routes (/login, /api/..., etc.) to proceed
    return NextResponse.next()
  }

  // On the main domain (e.g. evercart.murtuja.in or localhost:3000):
  // If someone directly visits /admin, redirect them to the admin subdomain
  if (pathname === '/admin' || pathname === '/admin/' || pathname.startsWith('/admin/')) {
    let targetOrigin = 'https://admin.evercart.murtuja.in'
    if (host.includes('localhost')) {
      const protocol = request.nextUrl.protocol || 'http:'
      targetOrigin = `${protocol}//admin.${host}`
    } else if (host.includes('evercart.murtuja.in')) {
      targetOrigin = 'https://admin.evercart.murtuja.in'
    }

    const redirectUrl = new URL('/', targetOrigin)
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
