// Single source of truth for "who owns this data" until v2 adds real accounts.
// Every Prisma query in the app filters or writes with this value so that
// swapping it for a session-derived user id later is a query-layer change,
// not a data migration.
export function getOwnerId(): string {
  const ownerId = process.env.OWNER_ID;
  if (!ownerId) {
    throw new Error("OWNER_ID environment variable is not set.");
  }
  return ownerId;
}
