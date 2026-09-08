import NextAuth, { DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';
import { Role } from '@/lib/mock-api/db';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      profileCompleted: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: Role;
    profileCompleted: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: Role;
    profileCompleted?: boolean;
  }
}
