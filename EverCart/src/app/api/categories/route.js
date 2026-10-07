import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'
import Product from '../../../models/Product.js'

export async function GET() {
  try {
    await connectDB()
    
    const categories = await Product.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          slug: { $toLower: '$_id' },
          count: 1,
          _id: 0
        }
      },
      { $sort: { name: 1 } }
    ])
    
    return NextResponse.json(categories, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
      }
    })
    
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
