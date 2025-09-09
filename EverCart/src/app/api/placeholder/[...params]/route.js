import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const [width, height] = params.params
  
  const w = parseInt(width) || 300
  const h = parseInt(height) || 300
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect x="10%" y="10%" width="80%" height="80%" fill="#e5e7eb" rx="8"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="#9ca3af">
        No Image
      </text>
    </svg>
  `
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  })
}
