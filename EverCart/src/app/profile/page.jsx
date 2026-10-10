'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthModal from '../../components/AuthModal'
import { toast } from '../../components/Toast'
import { ChevronRightIcon } from '../../components/CategoryIcons'
import ProfileSkeleton from '../../components/skeletons/ProfileSkeleton'

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'addresses' | 'password'
  const [user, setUser] = useState(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const loadAddresses = useCallback(async (userId) => {
    try {
      setLoadingAddresses(true)
      const response = await fetch(`/api/addresses?userId=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        setAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    } finally {
      setLoadingAddresses(false)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
      if (!stored) {
        setUser(null)
        setAuthChecking(false)
        setAuthModalOpen(true)
        return
      }

      const userData = JSON.parse(stored)
      setUser(userData)
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || ''
      })
      setAuthChecking(false)

      if (userData._id) {
        await loadAddresses(userData._id)
      }
    } catch (err) {
      console.error('Authentication error:', err)
      setAuthChecking(false)
    }
  }, [loadAddresses])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleProfileUpdate = (e) => {
    e.preventDefault()
    try {
      const stored = localStorage.getItem('currentUser')
      if (stored) {
        const parsed = JSON.parse(stored)
        const updated = {
          ...parsed,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone
        }
        localStorage.setItem('currentUser', JSON.stringify(updated))
        setUser(updated)
      }
      toast.success('Profile details updated successfully!')
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update profile')
    }
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    if (!passwordData.currentPassword) {
      toast.warning('Please enter your current password')
      return
    }
    if (passwordData.newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warning('New passwords do not match!')
      return
    }
    toast.success('Password changed successfully!')
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode']
    const missing = required.filter(field => !addressForm[field]?.trim())

    if (missing.length > 0) {
      toast.warning(`Please fill in required fields: ${missing.join(', ')}`)
      return
    }

    try {
      setSavingAddress(true)
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')

      if (editingAddress) {
        const response = await fetch('/api/addresses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addressId: editingAddress._id,
            userId: currentUser._id,
            ...addressForm
          })
        })

        if (response.ok) {
          const data = await response.json()
          setAddresses(prev => prev.map(a => (a._id === editingAddress._id ? data.address : a)))
          setShowAddressModal(false)
          resetAddressForm()
          toast.success('Address updated successfully!')
        } else {
          const err = await response.json()
          toast.error(err.error || 'Failed to update address')
        }
      } else {
        const response = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser._id,
            ...addressForm
          })
        })

        if (response.ok) {
          const data = await response.json()
          setAddresses(prev => [...prev, data.address])
          setShowAddressModal(false)
          resetAddressForm()
          toast.success('New address saved!')
        } else {
          const err = await response.json()
          toast.error(err.error || 'Failed to add address')
        }
      }
    } catch (error) {
      console.error('Error saving address:', error)
      toast.error('An error occurred while saving address')
    } finally {
      setSavingAddress(false)
    }
  }

  const handleEditAddress = (address) => {
    setEditingAddress(address)
    setAddressForm({
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      email: address.email || '',
      phone: address.phone || '',
      address: address.address || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      isDefault: Boolean(address.isDefault)
    })
    setShowAddressModal(true)
  }

  const handleAddressDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this address?')) return

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      const response = await fetch(`/api/addresses?addressId=${id}&userId=${currentUser._id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAddresses(prev => prev.filter(addr => addr._id !== id))
        toast.success('Address deleted successfully')
      } else {
        const err = await response.json()
        toast.error(err.error || 'Failed to delete address')
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      toast.error('Could not delete address')
    }
  }

  const handleSetDefault = async (address) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      const response = await fetch('/api/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: address._id,
          userId: currentUser._id,
          ...address,
          isDefault: true
        })
      })

      if (response.ok) {
        setAddresses(prev => prev.map(a => ({
          ...a,
          isDefault: a._id === address._id
        })))
        toast.success('Default address updated')
      }
    } catch (err) {
      console.error('Error setting default address:', err)
    }
  }

  const resetAddressForm = () => {
    setAddressForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: false
    })
    setEditingAddress(null)
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('currentUser')
      toast.info('Signed out successfully')
      router.push('/')
    }
  }

  if (authChecking) {
    return <ProfileSkeleton />
  }

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-gray-50/50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 sm:p-8 text-center animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shadow-2xs">
            👤
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-2">
            Sign In to View Your Profile
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed mb-6">
            Your personal details, saved shipping addresses, and security settings are protected. Please sign in to manage your account.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="flex-1 h-11 bg-black text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors shadow-xs"
            >
              Sign In / Register
            </button>
            <Link
              href="/"
              className="flex-1 h-11 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold inline-flex items-center justify-center transition-colors"
            >
              Return to Store
            </Link>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialTab="login"
          onAuthSuccess={(u) => {
            setUser(u)
            checkAuth()
          }}
        />
      </div>
    )
  }

  const userInitials = () => {
    const f = profileData.firstName?.[0] || user?.name?.[0] || 'U'
    const l = profileData.lastName?.[0] || ''
    return (f + l).toUpperCase()
  }

  const fullName = () => {
    if (profileData.firstName || profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`.trim()
    }
    return user?.name || user?.email?.split('@')[0] || 'EverCart Member'
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-6 sm:py-8">
      {/* Aligned 1:1 with Navbar Logo via max-w-7xl */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">My Account</span>
        </nav>

        {/* Profile Hero Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* User Avatar Circle */}
              <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center text-lg font-black tracking-wider shadow-sm shrink-0">
                {userInitials()}
              </div>

              {/* User Identity Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">
                    {fullName()}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Verified Customer
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {profileData.email || user?.email || 'No email provided'}
                </p>
              </div>
            </div>

            {/* Quick Summary Chips */}
            <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
              <Link
                href="/orders"
                className="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-xs font-semibold text-gray-800 transition-colors inline-flex items-center gap-1.5"
              >
                <span>📦</span>
                <span>My Orders</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-gray-200/80 text-xs font-semibold text-gray-700 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Navigation Sidebar */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3 sm:p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1.5 block">
                Account Settings
              </span>
              <nav className="space-y-1 mt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'profile'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile Details</span>
                  </div>
                  <ChevronRightIcon className={`w-3.5 h-3.5 ${activeTab === 'profile' ? 'text-white' : 'text-gray-400'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'addresses'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Saved Addresses</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === 'addresses' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {addresses.length}
                    </span>
                    <ChevronRightIcon className={`w-3.5 h-3.5 ${activeTab === 'addresses' ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('password')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'password'
                      ? 'bg-black text-white shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Security & Password</span>
                  </div>
                  <ChevronRightIcon className={`w-3.5 h-3.5 ${activeTab === 'password' ? 'text-white' : 'text-gray-400'}`} />
                </button>
              </nav>


            </div>

            {/* Quick Security Status Box */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 text-xs text-gray-600">
              <div className="flex items-center gap-2 text-emerald-700 font-bold mb-1">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Account Protection Active</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Your EverCart account credentials and payment tokens are stored with 256-Bit SSL encryption.
              </p>
            </div>
          </div>

          {/* Right Column: Tab Panels */}
          <div className="lg:col-span-8">
            {/* Tab 1: Profile Details */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 animate-in fade-in duration-300">
                <div className="pb-4 border-b border-gray-100 mb-6">
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">Personal Information</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Update your personal contact details used for orders and shipping.
                  </p>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        className="w-full h-11 px-3.5 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900 transition-all"
                        placeholder="e.g. Golam"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        className="w-full h-11 px-3.5 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900 transition-all"
                        placeholder="e.g. Murtuja"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full h-11 px-3.5 text-xs bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed pr-24"
                        placeholder="name@example.com"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Primary ID
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Email address is linked to your authentication account and cannot be modified.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full h-11 px-3.5 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900 transition-all"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      type="submit"
                      className="h-10 px-6 bg-black text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors shadow-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Saved Addresses */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100 mb-6">
                  <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Saved Addresses</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Manage your delivery locations for fast 1-click checkout.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetAddressForm()
                      setShowAddressModal(true)
                    }}
                    className="h-9 px-4 bg-black text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors shadow-xs self-start sm:self-auto"
                  >
                    <span>+ Add New Address</span>
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="py-12 text-center text-xs text-gray-400">Loading saved addresses...</div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/40">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">No saved addresses found</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                      Add a shipping address so you won&apos;t have to type it again during future orders.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        resetAddressForm()
                        setShowAddressModal(true)
                      }}
                      className="h-9 px-4 bg-black text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1 hover:bg-neutral-800 transition-colors"
                    >
                      <span>Add Address</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {addresses.map((address, index) => (
                      <div
                        key={address._id || `addr-${index}`}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          address.isDefault
                            ? 'bg-emerald-50/30 border-emerald-200 shadow-2xs'
                            : 'bg-white border-gray-200/90 hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                              {address.firstName} {address.lastName}
                            </h4>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed mb-1">
                            {address.address}
                          </p>
                          <p className="text-xs text-gray-500">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-2">
                            Phone: {address.phone}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                          {!address.isDefault ? (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(address)}
                              className="text-[11px] font-semibold text-gray-600 hover:text-black underline underline-offset-2"
                            >
                              Set as Default
                            </button>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-700">Primary Delivery</span>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditAddress(address)}
                              className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-[11px] font-semibold text-gray-700 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddressDelete(address._id)}
                              className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-gray-200/80 text-[11px] font-semibold text-gray-700 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Security & Password */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 animate-in fade-in duration-300">
                <div className="pb-4 border-b border-gray-100 mb-6">
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">Security & Password</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Update your account password to ensure your profile stays protected.
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full h-11 px-3.5 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900 transition-all"
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full h-11 px-3.5 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900 transition-all"
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full h-11 px-3.5 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900 transition-all"
                      placeholder="Repeat new password"
                      required
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      type="submit"
                      className="h-10 px-6 bg-black text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors shadow-xs"
                    >
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Address Modal Dialog */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight">
                    {editingAddress ? 'Edit Shipping Address' : 'Add New Shipping Address'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ensure accurate postal details for prompt deliveries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddressSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={addressForm.firstName}
                      onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900"
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={addressForm.lastName}
                      onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={addressForm.email}
                      onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900"
                      placeholder="+91 9876543210"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Street Address</label>
                  <textarea
                    value={addressForm.address}
                    onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                    className="w-full p-3 text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900"
                    placeholder="House / Flat No., Building, Street Area"
                    rows="2"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900"
                      placeholder="City"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900"
                      placeholder="State"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:bg-white text-gray-900"
                      placeholder="700001"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-black focus:ring-black border-gray-300"
                  />
                  <label htmlFor="isDefault" className="text-xs font-semibold text-gray-700 cursor-pointer">
                    Set as my primary default delivery address
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="h-10 px-5 bg-black text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors shadow-xs disabled:opacity-50"
                  >
                    <span>{savingAddress ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}