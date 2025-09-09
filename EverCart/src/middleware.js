import { NextResponse } from 'next/server'

export function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/_next/image')) {
    const url = request.nextUrl.searchParams.get('url')
    
    if (!url || url.includes('undefined') || url.includes('404')) {
      const placeholderUrl = new URL('/api/placeholder/image', request.url)
      placeholderUrl.searchParams.set('text', 'No Image')
      placeholderUrl.searchParams.set('width', '300')
      placeholderUrl.searchParams.set('height', '300')
      return NextResponse.redirect(placeholderUrl)
    }
    
    if (url && (url.includes('i.dell.com') || url.includes('sony.co.in') || url.includes('404') || url.includes('500'))) {
      const placeholderUrl = new URL('/api/placeholder/image', request.url)
      placeholderUrl.searchParams.set('text', 'No Image')
      placeholderUrl.searchParams.set('width', '300')
      placeholderUrl.searchParams.set('height', '300')
      return NextResponse.redirect(placeholderUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
