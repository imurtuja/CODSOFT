import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value || cookieStore.get('token')?.value

  if (!token) {
    notFound()
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (!decoded || decoded.role !== 'admin') {
      notFound()
    }
  } catch (err) {
    notFound()
  }

  return <>{children}</>
}
