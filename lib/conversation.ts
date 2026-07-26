import { prisma } from "./prisma";
import { getOwnerId } from "./owner";

// The conversation currently shown on the chat page — the most recent one
// that hasn't been archived. Created lazily so a brand-new deployment
// doesn't need a seed row.
export async function getActiveConversationId(): Promise<string> {
  const userId = getOwnerId();
  const existing = await prisma.conversation.findFirst({
    where: { userId, isArchived: false },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing.id;
  const created = await prisma.conversation.create({ data: { userId } });
  return created.id;
}

// "Start new chat": archive whatever's currently active and open a fresh
// one. Nothing is deleted — archived messages and their outfits stay in the
// database, they just stop being what the chat page loads.
export async function startNewConversation(): Promise<string> {
  const userId = getOwnerId();
  await prisma.conversation.updateMany({
    where: { userId, isArchived: false },
    data: { isArchived: true },
  });
  const created = await prisma.conversation.create({ data: { userId } });
  return created.id;
}
