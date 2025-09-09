'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [addresses, setAddresses] = useState([])
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
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

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const user = localStorage.getItem('currentUser')
    if (!user) {
      alert('Please login to view your profile')
      window.location.href = '/login'
      return
    }
    
    const userData = JSON.parse(user)
    setProfileData({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      phone: userData.phone || ''
    })
    
    // Load addresses from API
    await loadAddresses(userData._id)
  }

  const loadAddresses = async (userId) => {
    try {
      const response = await fetch(`/api/addresses?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAddresses(data.addresses || [])
        console.log('Loaded addresses from API:', data.addresses)
      } else {
        console.error('Failed to load addresses:', response.status)
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }

  const handleProfileUpdate = (e) => {
    e.preventDefault()
    alert('Profile updated successfully!')
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!')
      return
    }
    alert('Password changed successfully!')
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Validate required fields
      const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode']
      const missing = required.filter(field => !addressForm[field]?.trim())
      
      if (missing.length > 0) {
        alert(`Please fill in all required fields: ${missing.join(', ')}`)
        return
      }

      const user = JSON.parse(localStorage.getItem('currentUser'))
      
      if (editingAddress) {
        // Update existing address
        const response = await fetch('/api/addresses', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            addressId: editingAddress._id,
            userId: user._id,
            ...addressForm
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Update local state
          const updatedAddresses = addresses.map(addr => 
            addr._id === editingAddress._id ? data.address : addr
          )
          setAddresses(updatedAddresses)
          
          setShowAddressModal(false)
          setEditingAddress(null)
          resetAddressForm()
          alert('Address updated successfully!')
        } else {
          const errorData = await response.json()
          alert(`Failed to update address: ${errorData.error}`)
        }
      } else {
        // Create new address
        const response = await fetch('/api/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user._id,
            ...addressForm
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Update local state
          setAddresses([...addresses, data.address])
          
          setShowAddressModal(false)
          setEditingAddress(null)
          resetAddressForm()
          alert('Address added successfully!')
        } else {
          const errorData = await response.json()
          alert(`Failed to save address: ${errorData.error}`)
        }
      }
      
    } catch (error) {
      console.error('Error saving address:', error)
      alert('Error saving address. Please try again.')
    }
  }

  const handleEditAddress = (address) => {
    setEditingAddress(address)
    setAddressForm(address)
    setShowAddressModal(true)
  }

  const handleAddressDelete = async (id) => {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        const user = JSON.parse(localStorage.getItem('currentUser'))
        
        const response = await fetch(`/api/addresses?addressId=${id}&userId=${user._id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          // Remove from local state
          const updatedAddresses = addresses.filter(addr => addr._id !== id)
          setAddresses(updatedAddresses)
          
          alert('Address deleted successfully!')
        } else {
          const errorData = await response.json()
          alert(`Failed to delete address: ${errorData.error}`)
        }
      } catch (error) {
        console.error('Error deleting address:', error)
        alert('Error deleting address. Please try again.')
      }
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === 'profile' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Profile Details
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === 'addresses' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Addresses
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === 'password' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Change Password
                </button>
                <Link
                  href="/orders"
                  className="block w-full text-left px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Order History
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Profile Details Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Profile Details</h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Update Profile
                    </button>
                  </form>
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Saved Addresses</h2>
                    <button 
                      onClick={() => {
                        resetAddressForm()
                        setShowAddressModal(true)
                      }}
                      className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm"
                    >
                      Add New Address
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {addresses.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No saved addresses yet. Add your first address below.</p>
                      </div>
                    )}
                     {addresses.map((address, index) => (
                       <div key={address._id || `address-${index}`} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h3 className="font-medium text-gray-900">{address.firstName} {address.lastName}</h3>
                              {address.isDefault && (
                                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">
                              {address.address}<br />
                              {address.city}, {address.state} {address.zipCode}<br />
                              Phone: {address.phone}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditAddress(address)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                             <button
                               onClick={() => handleAddressDelete(address._id)}
                               className="text-red-600 hover:text-red-800 text-sm"
                             >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Change Password
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={addressForm.firstName}
                      onChange={(e) => setAddressForm({...addressForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={addressForm.lastName}
                      onChange={(e) => setAddressForm({...addressForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={addressForm.email}
                    onChange={(e) => setAddressForm({...addressForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={addressForm.address}
                    onChange={(e) => setAddressForm({...addressForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                    placeholder="Enter full address"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                      placeholder="City"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                      placeholder="State"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                      placeholder="ZIP Code"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                      placeholder="Phone"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                    Set as default address
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                  >
                    {editingAddress ? 'Update Address' : 'Add Address'}
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