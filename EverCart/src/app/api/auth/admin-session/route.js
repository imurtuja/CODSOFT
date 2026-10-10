import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb.js'
import User from '../../../../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getAuthUser, getCookieDomain } from '../../../../lib/auth.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key'

function setAdminCookies(response, token, request) {
  const isProd = process.env.NODE_ENV === 'production'
  const cookieDomain = getCookieDomain(request)

  const cookieBase = {
    path: '/',
    sameSite: 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60,
  }

  // Host-only cookies
  response.cookies.set('token', token, { ...cookieBase, httpOnly: false })
  response.cookies.set('admin_token', token, { ...cookieBase, httpOnly: true })

  // Cross-subdomain cookies
  if (cookieDomain) {
    response.cookies.set('token_shared', token, { ...cookieBase, domain: cookieDomain, httpOnly: false })
    response.cookies.set('admin_token_shared', token, { ...cookieBase, domain: cookieDomain, httpOnly: true })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const claimTicket = searchParams.get('claim')

    await connectDB()

    // Exchange short-lived transfer ticket
    if (claimTicket) {
      try {
        const decoded = jwt.verify(claimTicket, JWT_SECRET)
        if (decoded && decoded.type === 'admin_transfer' && decoded.userId) {
          const user = await User.findById(decoded.userId).select('-password').lean()
          if (user && user.role === 'admin') {
            const token = jwt.sign(
              {
                userId: user._id,
                email: user.email,
                role: 'admin'
              },
              JWT_SECRET,
              { expiresIn: '7d', algorithm: 'HS256' }
            )

            const safeUser = JSON.stringify(user)
            const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authenticating Admin...</title>
  <style>body{margin:0;background:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,sans-serif}.loader{width:24px;height:24px;border:2.5px solid #e5e7eb;border-top-color:#000;border-radius:50%;animation:spin .6s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style>
</head>
<body>
  <div class="loader"></div>
  <script>
    try {
      localStorage.setItem('token', ${JSON.stringify(token)});
      localStorage.setItem('currentUser', ${JSON.stringify(safeUser)});
      localStorage.setItem('user', ${JSON.stringify(safeUser)});
    } catch (e) {}
    window.location.replace('/');
  </script>
</body>
</html>`

            const response = new NextResponse(html, {
              status: 200,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
              },
            })

            setAdminCookies(response, token, request)
            return response
          }
        }
      } catch (err) {
        console.warn('Invalid or expired admin transfer ticket:', err.message)
      }

      // Fall back to root if ticket verification fails
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Validate existing session
    const authUser = getAuthUser(request)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const user = await User.findById(authUser.userId).select('-password').lean()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ authenticated: false }, { status: 403 })
    }

    // Issue refreshed token for client storage
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    )

    const response = NextResponse.json({
      authenticated: true,
      token,
      user
    })

    setAdminCookies(response, token, request)
    return response
  } catch (error) {
    console.error('Session verify error:', error.message)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()

    // Handle authenticated session transfer from storefront
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const incomingToken = authHeader.substring(7).trim()
      try {
        const decoded = jwt.verify(incomingToken, JWT_SECRET)
        if (decoded && decoded.role === 'admin') {
          const user = await User.findById(decoded.userId).select('-password').lean()
          if (user && user.role === 'admin') {
            // Issue short-lived transfer ticket (30s)
            const ticket = jwt.sign(
              {
                userId: user._id,
                type: 'admin_transfer'
              },
              JWT_SECRET,
              { expiresIn: '30s', algorithm: 'HS256' }
            )

            const response = NextResponse.json({
              success: true,
              authenticated: true,
              ticket,
              token: incomingToken,
              user
            })

            setAdminCookies(response, incomingToken, request)
            return response
          }
        }
      } catch (err) {}
    }

    // Credential authentication fallback
    const body = await request.json().catch(() => ({}))
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied: Administrator privileges required' },
        { status: 403 }
      )
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    )

    const { password: _, ...safeUser } = user.toObject()
    const response = NextResponse.json({
      success: true,
      authenticated: true,
      token,
      user: safeUser
    })

    setAdminCookies(response, token, request)
    return response
  } catch (error) {
    console.error('Admin authentication error:', error.message)
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const isProd = process.env.NODE_ENV === 'production'
    const cookieDomain = getCookieDomain(request)
    const response = NextResponse.json({ success: true, message: 'Logged out' })

    const cookieNames = ['token', 'admin_token', 'token_shared', 'admin_token_shared']
    for (const name of cookieNames) {
      response.cookies.set(name, '', {
        path: '/',
        expires: new Date(0),
        sameSite: 'lax',
        secure: isProd,
      })
      if (cookieDomain) {
        response.cookies.set(name, '', {
          path: '/',
          domain: cookieDomain,
          expires: new Date(0),
          sameSite: 'lax',
          secure: isProd,
        })
      }
    }
    return response
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
