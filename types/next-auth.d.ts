import type { DefaultSession } from "next-auth";

// The `session` callback in auth.ts copies the JWT's user id onto
// `session.user.id`, which isn't part of Auth.js's default Session shape.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
