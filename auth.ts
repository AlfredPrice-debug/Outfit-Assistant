import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Auth.js only auto-trusts the `host` header on platforms it recognizes
  // (e.g. Vercel). Railway isn't one of them, so without this every request
  // is rejected with an UntrustedHost error before the app ever loads.
  // Railway terminates TLS and sets `host` itself, so this is safe here.
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async signIn({ user }) {
      const allowedEmails = process.env.ALLOWED_EMAILS;
      if (!allowedEmails) {
        return false;
      }
      const allowList = allowedEmails.split(",").map((email) => email.trim().toLowerCase());
      const candidate = user.email?.trim().toLowerCase();
      return !!candidate && allowList.includes(candidate);
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
