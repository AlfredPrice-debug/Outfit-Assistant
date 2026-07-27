import { auth } from "@/auth";

// Lets the app be exercised locally without completing real Google OAuth
// (there's no way to do that from an automated/headless environment).
// Double-gated so an accidental TEST_BYPASS_AUTH=true in Railway's
// Variables tab could never activate this in production: it also requires
// the ABSENCE of RAILWAY_ENVIRONMENT/RAILWAY_PROJECT_ID, which Railway
// auto-injects into every service and can't be unset from the dashboard.
// Never set TEST_BYPASS_AUTH in Railway.
export const TEST_BYPASS_USER_ID = "local-test-user";

export function isTestBypassActive(): boolean {
  return (
    process.env.TEST_BYPASS_AUTH === "true" &&
    !process.env.RAILWAY_ENVIRONMENT &&
    !process.env.RAILWAY_PROJECT_ID
  );
}

// Single source of truth for "who owns this data." Every Prisma query in the
// app filters or writes with this value, derived from the signed-in session.
export async function getOwnerId(): Promise<string> {
  if (isTestBypassActive()) {
    return TEST_BYPASS_USER_ID;
  }
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("No authenticated session.");
  }
  return session.user.id;
}
