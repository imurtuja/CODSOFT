'use client'

import { useRouter } from 'next/navigation'
import AuthModal from '../../components/AuthModal'

export default function SignupPage() {
  const router = useRouter()

  const handleClose = () => {
    router.push('/')
  }

  const handleAuthSuccess = () => {
    const redirectUrl = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('redirect')
      : null
    router.push(redirectUrl || '/')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 p-4">
      <AuthModal
        isOpen={true}
        onClose={handleClose}
        initialTab="signup"
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}