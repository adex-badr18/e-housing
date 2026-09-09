import NextAuth, { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { mockDB, Role } from './mock-api/db';
import dns from 'node:dns';

if (typeof dns !== 'undefined' && typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

export const authOptions: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
      authorization: {
        params: {
          hd: 'oauife.edu.ng',
          prompt: 'select_account',
        },
      },
    }),
    CredentialsProvider({
      name: 'OAU Institutional Login',
      credentials: {
        email: { label: 'Official Email', type: 'email', placeholder: 'staff@oauife.edu.ng' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const emailStr = (credentials.email as string).trim().toLowerCase();

        // Enforce server-side @oauife.edu.ng restriction
        if (!emailStr.endsWith('@oauife.edu.ng')) {
          return null;
        }

        let user = mockDB.findUserByEmail(emailStr);
        if (!user) {
          // Automatic registration for first-time staff login
          const nameParts = emailStr.split('@')[0].split('.');
          const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Staff';
          const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Member';

          user = {
            id: mockDB.generateId('u'),
            email: emailStr,
            firstName,
            lastName,
            role: 'STAFF',
            isActive: true,
            profileCompleted: false,
            createdAt: new Date().toISOString(),
          };
          mockDB.users.push(user);
        }

        if (!user.isActive) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          profileCompleted: user.profileCompleted ?? false,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase().trim();

      // Enforce hosted domain @oauife.edu.ng
      if (!email.endsWith('@oauife.edu.ng')) {
        return false;
      }

      // Automatically upsert user in mockDB
      let dbUser = mockDB.findUserByEmail(email);
      if (!dbUser) {
        const givenName = (profile as { given_name?: string })?.given_name || user.name?.split(' ')[0] || 'Staff';
        const familyName = (profile as { family_name?: string })?.family_name || user.name?.split(' ').slice(1).join(' ') || 'Member';

        dbUser = {
          id: mockDB.generateId('u'),
          email,
          firstName: givenName,
          lastName: familyName,
          role: 'STAFF',
          isActive: true,
          profileCompleted: false,
          createdAt: new Date().toISOString(),
        };
        mockDB.users.push(dbUser);
      }

      user.id = dbUser.id;
      user.role = dbUser.role;
      user.profileCompleted = dbUser.profileCompleted ?? false;

      return dbUser.isActive;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.profileCompleted = user.profileCompleted;
      }

      if (trigger === 'update' && session?.profileCompleted !== undefined) {
        token.profileCompleted = session.profileCompleted;
      }

      // Re-hydrate latest user profile state from DB (check by ID first, then by Email)
      const email = token.email as string | undefined;
      const id = token.id as string | undefined;

      const dbUser =
        (id ? mockDB.findUserById(id) : undefined) ||
        (email ? mockDB.findUserByEmail(email) : undefined);

      if (dbUser) {
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.profileCompleted = dbUser.profileCompleted ?? false;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.profileCompleted = (token.profileCompleted as boolean) ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);
