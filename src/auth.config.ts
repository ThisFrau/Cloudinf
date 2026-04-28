import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-safe auth config — NO Prisma, NO bcrypt, NO Node.js-only modules.
 * Used exclusively by the middleware (Edge Runtime).
 * The full config with Prisma adapter lives in src/auth.ts.
 */
export default {
  providers: [], // Providers requiring Node modules are added in auth.ts only
  pages: {
    signIn: '/login',
    error: '/login',
  },
} satisfies NextAuthConfig
