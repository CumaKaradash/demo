import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface User {
    role: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials: { email: string; password: string } | undefined) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // For demo purposes, we'll use a hardcoded admin user
        // In production, this should be replaced with database lookup
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@psikolog.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        if (credentials.email === adminEmail && credentials.password === adminPassword) {
          return {
            id: '1',
            email: adminEmail,
            name: 'Psikolog Admin',
            role: 'admin'
          };
        }

        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  }
});
