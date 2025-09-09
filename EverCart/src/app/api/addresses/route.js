import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import mongoose from 'mongoose'

export async function GET(request) {
  try {
    await connectDB()
    
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      addresses: user.addresses || [] 
    })

  } catch (error) {
    console.error('Get addresses error:', error)
    return NextResponse.json(
      { error: 'Failed to get addresses' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    await connectDB()
    
    const { firstName, lastName, email, phone, address, city, state, zipCode, userId, isDefault } = await request.json()
    
    if (!firstName || !lastName || !email || !phone || !address || !city || !state || !zipCode) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      isDefault: isDefault || false,
      createdAt: new Date()
    }

    if (!user.addresses) {
      user.addresses = []
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false)
    }

    user.addresses.push(newAddress)
    await user.save()

    return NextResponse.json({ 
      message: 'Address saved successfully',
      address: newAddress
    })

  } catch (error) {
    console.error('Save address error:', error)
    return NextResponse.json(
      { error: 'Failed to save address' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    await connectDB()
    
    const { addressId, firstName, lastName, email, phone, address, city, state, zipCode, userId, isDefault } = await request.json()
    
    if (!addressId || !userId) {
      return NextResponse.json({ error: 'Address ID and User ID required' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId)
    if (addressIndex === -1) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // Update address
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex],
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      isDefault: isDefault || false,
      updatedAt: new Date()
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach((addr, index) => {
        if (index !== addressIndex) {
          addr.isDefault = false
        }
      })
    }

    await user.save()

    return NextResponse.json({ 
      message: 'Address updated successfully',
      address: user.addresses[addressIndex]
    })

  } catch (error) {
    console.error('Update address error:', error)
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const addressId = searchParams.get('addressId')
    const userId = searchParams.get('userId')
    
    if (!addressId || !userId) {
      return NextResponse.json({ error: 'Address ID and User ID required' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId)
    if (addressIndex === -1) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    user.addresses.splice(addressIndex, 1)
    await user.save()

    return NextResponse.json({ 
      message: 'Address deleted successfully'
    })

  } catch (error) {
    console.error('Delete address error:', error)
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    )
  }
}
