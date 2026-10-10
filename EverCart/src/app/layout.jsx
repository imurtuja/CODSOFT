import './globals.css'
import { Suspense } from 'react'
import { headers, cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { Inter } from 'next/font/google'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ErrorBoundary from '../components/ErrorBoundary'
import ToastContainer from '../components/Toast'
import NavigationProgress from '../components/NavigationProgress'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'EverCart - Your Ultimate Shopping Destination',
  description: 'Shop the latest electronics, gadgets, and more at EverCart',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/favicon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
}

export default async function RootLayout({ children }) {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const isAdminHeader = headersList.get('x-is-admin') === 'true'
  const isAdminHost = host.startsWith('admin.') || host.includes('admin.evercart')
  const isTargetingAdmin = isAdminHeader || isAdminHost

  // Verify server-side whether visitor is an actual authenticated admin
  let isVerifiedAdmin = false
  if (isTargetingAdmin) {
    try {
      const cookieStore = await cookies()
      const adminToken = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value
      if (adminToken) {
        const decoded = jwt.verify(adminToken, JWT_SECRET)
        if (decoded && decoded.role === 'admin') {
          isVerifiedAdmin = true
        }
      }
    } catch (e) {
      isVerifiedAdmin = false
    }
  }

  // Only hide storefront navbar/footer for an authenticated admin viewing admin console
  // For non-admin visitors or 404 errors, storefront chrome is always preserved consistently
  const showStorefrontChrome = !isVerifiedAdmin

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress development console errors and warnings
              (function() {
                const originalError = console.error;
                const originalWarn = console.warn;
                const originalLog = console.log;
                
                console.error = function(...args) {
                  const message = args[0]?.toString() || '';
                  if (
                    message.includes('otp-credentials') ||
                    message.includes('lumberjack.razorpay.com') ||
                    message.includes('browser.sentry-cdn.com') ||
                    message.includes('svg') ||
                    message.includes('Expected length') ||
                    message.includes('ERR_BLOCKED_BY_CLIENT') ||
                    message.includes('Unrecognized feature') ||
                    message.includes('Failed to load resource') ||
                    message.includes('placeholder-product.jpg') ||
                    message.includes('sony.co.in') ||
                    message.includes('React DevTools') ||
                    message.includes('Fast Refresh') ||
                    message.includes('hot-reloader') ||
                    message.includes('report-hmr') ||
                    message.includes('webpack') ||
                    message.includes('react-dom') ||
                    message.includes('react-server-dom') ||
                    message.includes('app-index') ||
                    message.includes('app-next-dev') ||
                    message.includes('app-bootstrap') ||
                    message.includes('main-app') ||
                    message.includes('v2-entry') ||
                    message.includes('checkout.js') ||
                    message.includes('checkout-static')
                  ) {
                    return;
                  }
                  originalError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  const message = args[0]?.toString() || '';
                  if (
                    message.includes('otp-credentials') ||
                    message.includes('lumberjack.razorpay.com') ||
                    message.includes('browser.sentry-cdn.com') ||
                    message.includes('svg') ||
                    message.includes('Expected length') ||
                    message.includes('ERR_BLOCKED_BY_CLIENT') ||
                    message.includes('Unrecognized feature') ||
                    message.includes('Failed to load resource') ||
                    message.includes('placeholder-product.jpg') ||
                    message.includes('sony.co.in') ||
                    message.includes('React DevTools') ||
                    message.includes('Fast Refresh') ||
                    message.includes('hot-reloader') ||
                    message.includes('report-hmr') ||
                    message.includes('webpack') ||
                    message.includes('react-dom') ||
                    message.includes('react-server-dom') ||
                    message.includes('app-index') ||
                    message.includes('app-next-dev') ||
                    message.includes('app-bootstrap') ||
                    message.includes('main-app') ||
                    message.includes('v2-entry') ||
                    message.includes('checkout.js') ||
                    message.includes('checkout-static')
                  ) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };
                
                // Global error handler
                window.addEventListener('error', function(event) {
                  if (
                    event.message?.includes('otp-credentials') ||
                    event.message?.includes('lumberjack.razorpay.com') ||
                    event.message?.includes('browser.sentry-cdn.com') ||
                    event.message?.includes('svg') ||
                    event.message?.includes('Expected length') ||
                    event.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
                    event.message?.includes('Unrecognized feature') ||
                    event.message?.includes('Failed to load resource') ||
                    event.message?.includes('placeholder-product.jpg') ||
                    event.message?.includes('sony.co.in') ||
                    event.message?.includes('React DevTools') ||
                    event.message?.includes('Fast Refresh') ||
                    event.message?.includes('hot-reloader') ||
                    event.message?.includes('report-hmr') ||
                    event.message?.includes('webpack') ||
                    event.message?.includes('react-dom') ||
                    event.message?.includes('react-server-dom') ||
                    event.message?.includes('app-index') ||
                    event.message?.includes('app-next-dev') ||
                    event.message?.includes('app-bootstrap') ||
                    event.message?.includes('main-app') ||
                    event.message?.includes('v2-entry') ||
                    event.message?.includes('checkout.js') ||
                    event.message?.includes('checkout-static')
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                  }
                });
                
                window.addEventListener('unhandledrejection', function(event) {
                  if (
                    event.reason?.message?.includes('otp-credentials') ||
                    event.reason?.message?.includes('lumberjack.razorpay.com') ||
                    event.reason?.message?.includes('browser.sentry-cdn.com') ||
                    event.reason?.message?.includes('svg') ||
                    event.reason?.message?.includes('Expected length') ||
                    event.reason?.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
                    event.reason?.message?.includes('Unrecognized feature') ||
                    event.reason?.message?.includes('Failed to load resource') ||
                    event.reason?.message?.includes('placeholder-product.jpg') ||
                    event.reason?.message?.includes('sony.co.in') ||
                    event.reason?.message?.includes('React DevTools') ||
                    event.reason?.message?.includes('Fast Refresh') ||
                    event.reason?.message?.includes('hot-reloader') ||
                    event.reason?.message?.includes('report-hmr') ||
                    event.reason?.message?.includes('webpack') ||
                    event.reason?.message?.includes('react-dom') ||
                    event.reason?.message?.includes('react-server-dom') ||
                    event.reason?.message?.includes('app-index') ||
                    event.reason?.message?.includes('app-next-dev') ||
                    event.reason?.message?.includes('app-bootstrap') ||
                    event.reason?.message?.includes('main-app') ||
                    event.reason?.message?.includes('v2-entry') ||
                    event.reason?.message?.includes('checkout.js') ||
                    event.reason?.message?.includes('checkout-static')
                  ) {
                    event.preventDefault();
                    return false;
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Suspense fallback={null}>
          <div className="print:hidden">
            <NavigationProgress />
          </div>
        </Suspense>
        <ErrorBoundary>
          {showStorefrontChrome && (
            <div className="print:hidden">
              <Navbar />
            </div>
          )}
          <main className="min-h-screen print:min-h-0 print:p-0">
            {children}
          </main>
          {showStorefrontChrome && (
            <div className="print:hidden">
              <Footer />
            </div>
          )}
          <div className="print:hidden">
            <ToastContainer />
          </div>
        </ErrorBoundary>
      </body>
    </html>
  )
}

