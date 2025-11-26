import { NextRequest, NextResponse, userAgent } from 'next/server'

export function mobileBlockedMiddleware(request: NextRequest) {
  const { device } = userAgent(request)
  
  if (device.type === 'mobile' || device.type === 'tablet') {
    return NextResponse.rewrite(new URL('/mobile-blocked', request.url))
  }
  
  return null
}
