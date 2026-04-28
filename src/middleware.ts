import NextAuth from 'next-auth'
import authConfig from './auth.config'
import { NextResponse } from 'next/server'

// Use ONLY the edge-safe config here — no Prisma, no bcrypt.
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  if (!req.auth) {
    const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url))
  }
})

// Only protect /dashboard routes.
export const config = {
  matcher: ['/dashboard/:path*'],
}
