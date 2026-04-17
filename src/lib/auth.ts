import NextAuth, { DefaultSession, NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authenticateMockUser } from './mock-api/auth';
import { Role } from './mock-api/db';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: Role;
  }
}

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Mock Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'super@oauife.edu.ng' },
        password: { label: 'Password (any)', type: 'password' }, // Ignored for mock
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const user = await authenticateMockUser(credentials.email as string);        
        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Custom login page
  },
  session: { strategy: 'jwt' },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);
