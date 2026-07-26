import { auth } from "@/auth";

// Single source of truth for "who owns this data." Every Prisma query in the
// app filters or writes with this value, derived from the signed-in session.
export async function getOwnerId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("No authenticated session.");
  }
  return session.user.id;
}
