import { prisma } from "./prisma";
import { getOwnerId } from "./owner";
import type { FinalOutfit } from "./schemas";
import type { ChatTurn } from "./gemini";
import type { ChatHistoryMessage } from "./apiTypes";

const HISTORY_LIMIT = 20;

// Assistant turns store a small pointer — not prose — because the outfit
// data itself already lives in the Outfit table (that's what the Saved page
// reads from). Storing it twice would let the two copies drift out of sync
// whenever a save toggle changes isSaved after the fact.
interface AssistantPointer {
  outfitIds: string[];
  titles: string[];
}

export function encodeAssistantContent(outfits: { id: string; title: string }[]): string {
  const pointer: AssistantPointer = {
    outfitIds: outfits.map((o) => o.id),
    titles: outfits.map((o) => o.title),
  };
  return JSON.stringify(pointer);
}

function parsePointer(content: string): AssistantPointer | null {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed?.outfitIds)) return parsed as AssistantPointer;
    return null;
  } catch {
    return null;
  }
}

// Context fed back to Gemini for follow-up requests. Assistant turns collapse
// to their outfit titles rather than full JSON — enough for the model to
// avoid repeating itself or to act on "make the second one warmer", without
// spending tokens replaying rationale text it already generated once.
export async function getRecentHistory(): Promise<ChatTurn[]> {
  const userId = getOwnerId();
  const rows = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  return rows.reverse().map((row) => {
    if (row.role === "user") {
      return { role: "user", content: row.content };
    }
    const pointer = parsePointer(row.content);
    const summary = pointer
      ? `Previously suggested: ${pointer.titles.join(", ")}.`
      : row.content;
    return { role: "assistant", content: summary };
  });
}

export async function listChatMessages(): Promise<ChatHistoryMessage[]> {
  const userId = getOwnerId();
  const rows = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const allOutfitIds = new Set<string>();
  for (const row of rows) {
    if (row.role !== "user") {
      const pointer = parsePointer(row.content);
      pointer?.outfitIds.forEach((id) => allOutfitIds.add(id));
    }
  }

  const outfitRows = allOutfitIds.size
    ? await prisma.outfit.findMany({ where: { id: { in: [...allOutfitIds] } } })
    : [];
  const outfitById = new Map(outfitRows.map((o) => [o.id, o]));

  return rows.map((row) => {
    if (row.role === "user") {
      return { id: row.id, role: "user", createdAt: row.createdAt.toISOString(), content: row.content, outfits: null };
    }
    const pointer = parsePointer(row.content);
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
