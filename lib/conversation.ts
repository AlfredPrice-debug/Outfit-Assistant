import { prisma } from "./prisma";
import { getOwnerId } from "./owner";

// The conversation currently shown on the chat page: the most recent one
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
// one. Nothing is deleted; archived messages and their outfits stay in the
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

export interface ConversationSummary {
  id: string;
  createdAt: string;
  preview: string;
}

// Old chats, newest first. Each one's preview is its first user message
// (Gemini's own turns are a JSON pointer, not prose, so they'd make a
// useless preview) truncated to a scannable length.
export async function listArchivedConversations(): Promise<ConversationSummary[]> {
  const userId = getOwnerId();
  const conversations = await prisma.conversation.findMany({
    where: { userId, isArchived: true },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    conversations.map(async (conversation) => {
      const firstMessage = await prisma.chatMessage.findFirst({
        where: { conversationId: conversation.id, role: "user" },
        orderBy: { createdAt: "asc" },
      });
      return {
        id: conversation.id,
        createdAt: conversation.createdAt.toISOString(),
        preview: firstMessage ? firstMessage.content.slice(0, 80) : "Empty chat",
      };
    }),
  );
}

// Swaps an archived conversation back to active, archiving whatever's
// currently active in its place. Returns the number of conversations
// matching `id` for this user, so the caller can tell "not found" apart
// from "found and resumed".
export async function resumeConversation(id: string): Promise<number> {
  const userId = getOwnerId();
  const [, resumed] = await prisma.$transaction([
    prisma.conversation.updateMany({ where: { userId, isArchived: false }, data: { isArchived: true } }),
    prisma.conversation.updateMany({ where: { id, userId }, data: { isArchived: false } }),
  ]);
  return resumed.count;
}

// Permanently removes a conversation and its messages. Outfits aren't
// scoped to a conversation (see README), so saved/unsaved outfits generated
// during it are untouched. Returns the number of conversations matching
// `id` for this user.
export async function deleteConversation(id: string): Promise<number> {
  const userId = getOwnerId();
  const [, deleted] = await prisma.$transaction([
    prisma.chatMessage.deleteMany({ where: { conversationId: id, userId } }),
    prisma.conversation.deleteMany({ where: { id, userId } }),
  ]);
  return deleted.count;
}
