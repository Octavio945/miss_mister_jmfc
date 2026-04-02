import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Check if trying to access /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Exclude /admin/login from the protection
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    const adminToken = request.cookies.get('admin_token')

    // Simple check: if no token or token is totally invalid, redirect to login
    // In production, you'd decode a JWT and verify its signature
    if (!adminToken || adminToken.value !== 'authenticated') {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
