import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe auth config — NO Node.js-only modules (bcrypt, mongoose, etc.)
 * Used exclusively by middleware.ts which runs on the Edge runtime.
 */
export const authConfig = {
  session: { strategy: 'jwt' as const },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.currency = (user as any).currency;
        token.xp = (user as any).xp ?? 0;
        token.avatarUrl = (user as any).avatarUrl ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).currency = token.currency;
        (session.user as any).xp = token.xp ?? 0;
        (session.user as any).avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
  providers: [], // providers live in auth.ts (Node.js runtime only)
} satisfies NextAuthConfig;
