import { prisma } from "./prisma";
import { getActiveConversationId } from "./conversation";
import { getOwnerId } from "./owner";
import type { FinalOutfit } from "./schemas";
import type { ChatTurn } from "./gemini";
import type { ChatHistoryMessage } from "./apiTypes";

const HISTORY_LIMIT = 20;

// Assistant turns store a small pointer, not prose, because the outfit
// data itself already lives in the Outfit table (that's what the Saved page
// reads from). Storing it twice would let the two copies drift out of sync
// whenever a save toggle changes isSaved after the fact.
//
// A conversation-mode chat-only reply (no outfits yet) gets its own pointer
// kind instead, storing the reply text directly. Rows written before this
// existed have no "kind" field at all; parsePointer treats those as
// "outfits" (their only possible shape at the time), so old data keeps
// loading correctly with no migration needed.
interface AssistantOutfitsPointer {
  kind?: "outfits";
  outfitIds: string[];
  titles: string[];
}
interface AssistantChatPointer {
  kind: "chat";
  message: string;
}
type AssistantPointer = AssistantOutfitsPointer | AssistantChatPointer;

export function encodeAssistantContent(outfits: { id: string; title: string }[]): string {
  const pointer: AssistantOutfitsPointer = {
    kind: "outfits",
    outfitIds: outfits.map((o) => o.id),
    titles: outfits.map((o) => o.title),
  };
  return JSON.stringify(pointer);
}

export function encodeAssistantChat(message: string): string {
  const pointer: AssistantChatPointer = { kind: "chat", message };
  return JSON.stringify(pointer);
}

function parsePointer(content: string): AssistantPointer | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.kind === "chat" && typeof parsed.message === "string") {
      return { kind: "chat", message: parsed.message };
    }
    if (Array.isArray(parsed?.outfitIds)) {
      return parsed as AssistantOutfitsPointer;
    }
    return null;
  } catch {
    return null;
  }
}

// Context fed back to Gemini for follow-up requests. Outfits turns collapse
// to their titles rather than full JSON, enough for the model to avoid
// repeating itself or to act on "make the second one warmer", without
// spending tokens replaying rationale text it already generated once. Chat
// turns replay verbatim, since that's the actual prior conversation.
export async function getRecentHistory(): Promise<ChatTurn[]> {
  const userId = await getOwnerId();
  const conversationId = await getActiveConversationId();
  const rows = await prisma.chatMessage.findMany({
    where: { conversationId, userId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  return rows.reverse().map((row) => {
    if (row.role === "user") {
      return { role: "user", content: row.content };
    }
    const pointer = parsePointer(row.content);
    if (pointer?.kind === "chat") {
      return { role: "assistant", content: pointer.message };
    }
    const summary = pointer ? `Previously suggested: ${pointer.titles.join(", ")}.` : row.content;
    return { role: "assistant", content: summary };
  });
}

// How many chat-only replies Outfit MC has already given in a row, since the
// last time she generated outfits (or since the conversation started).
// app/api/chat/route.ts subtracts this from the user's configured cap to
// get how many chat turns remain before she must generate regardless.
export async function countRecentFollowUps(): Promise<number> {
  const userId = await getOwnerId();
  const conversationId = await getActiveConversationId();
  const rows = await prisma.chatMessage.findMany({
    where: { conversationId, userId, role: "assistant" },
    orderBy: { createdAt: "asc" },
    select: { content: true },
  });
  let count = 0;
  for (const row of rows) {
    const pointer = parsePointer(row.content);
    count = pointer?.kind === "chat" ? count + 1 : 0;
  }
  return count;
}

export async function listChatMessages(): Promise<ChatHistoryMessage[]> {
  const userId = await getOwnerId();
  const conversationId = await getActiveConversationId();
  const rows = await prisma.chatMessage.findMany({
    where: { conversationId, userId },
    orderBy: { createdAt: "asc" },
  });

  const allOutfitIds = new Set<string>();
  for (const row of rows) {
    if (row.role !== "user") {
      const pointer = parsePointer(row.content);
      if (pointer && pointer.kind !== "chat") {
        pointer.outfitIds.forEach((id) => allOutfitIds.add(id));
      }
    }
  }

  const outfitRows = allOutfitIds.size
    ? await prisma.outfit.findMany({ where: { id: { in: [...allOutfitIds] }, userId } })
    : [];
  const outfitById = new Map(outfitRows.map((o) => [o.id, o]));

  return rows.map((row) => {
    if (row.role === "user") {
      return { id: row.id, role: "user", createdAt: row.createdAt.toISOString(), content: row.content, outfits: null };
    }
    const pointer = parsePointer(row.content);
    if (pointer?.kind === "chat") {
      return {
        id: row.id,
        role: "assistant",
        createdAt: row.createdAt.toISOString(),
        content: pointer.message,
        outfits: [],
      };
    }
    const outfits = (pointer?.outfitIds ?? [])
      .map((id) => outfitById.get(id))
      .filter((o): o is NonNullable<typeof o> => Boolean(o))
      .map((o) => ({
        id: o.id,
        title: o.title,
        occasion: o.occasion,
        season: o.season,
        itemsByLayer: o.itemsByLayer as FinalOutfit["itemsByLayer"],
        rationale: o.rationale,
        colorStory: o.colorStory as FinalOutfit["colorStory"],
        inspirationLinks: o.inspirationLinks as FinalOutfit["inspirationLinks"],
        isSaved: o.isSaved,
      }));
    return { id: row.id, role: "assistant", createdAt: row.createdAt.toISOString(), content: null, outfits };
  });
}
