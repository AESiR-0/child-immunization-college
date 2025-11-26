import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { supabase } from '@/src/db/edge';
import { verifyPassword } from '@/utils/password';

export default {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email as string)
            .limit(1)
            .single();

          if (error || !user) {
            return null;
          }

          // Check if email is verified
          if (!user.email_verified) {
            // Return null to indicate authentication failure
            // The error will be handled in the login page
            return null;
          }

          const isPasswordValid = await verifyPassword(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnChart = nextUrl.pathname.startsWith('/chart');
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnSignup = nextUrl.pathname.startsWith('/signup');

      if (isOnDashboard || isOnChart) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && (isOnLogin || isOnSignup)) {
        return false; // Will redirect in middleware
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

