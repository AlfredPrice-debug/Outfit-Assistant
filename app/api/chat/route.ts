import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOwnerId } from "@/lib/owner";
import { getActiveConversationId } from "@/lib/conversation";
import { generateOutfits, type ClosetContextItem } from "@/lib/gemini";
import { encodeAssistantContent, getRecentHistory, listChatMessages } from "@/lib/chatHistory";
import type { ChatStreamEvent } from "@/lib/streamEvents";
import type { ClosetCategory } from "@/lib/schemas";
import {
  GeminiConfigError,
  GeminiRateLimitError,
  GeminiTimeoutError,
  GeminiMalformedOutputError,
} from "@/lib/errors";

// Prisma and the Google Gen AI SDK both need Node APIs, so this route can't
// run on the Edge runtime (that's reserved for middleware.ts in this app).
export const runtime = "nodejs";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

export async function GET() {
  try {
    const messages = await listChatMessages();
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json(
      { error: "The database is unavailable right now, so chat history couldn't be loaded." },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  const { message } = parsed.data;
  const userId = getOwnerId();

  // History is read before the new user message is written so it never
  // shows up twice: once as trailing context, once as the live request.
  let history: Awaited<ReturnType<typeof getRecentHistory>> = [];
  let dbAvailable = true;
  let conversationId = "";
  try {
    conversationId = await getActiveConversationId();
    history = await getRecentHistory();
  } catch {
    dbAvailable = false;
  }

  // Best-effort: a closet lookup failing shouldn't block generation, it just
  // means this request's suggestions won't reference anything the user owns.
  // The column is a plain string (validated as a ClosetCategory only at
  // write time, in /api/closet), so it's cast back on the way out.
  let closetItems: ClosetContextItem[] = [];
  try {
    const rows = await prisma.closetItem.findMany({
      where: { userId },
      select: { category: true, colorName: true, description: true },
      orderBy: { createdAt: "desc" },
    });
    closetItems = rows.map((row) => ({ ...row, category: row.category as ClosetCategory }));
  } catch {
    closetItems = [];
  }

  if (dbAvailable) {
    try {
      await prisma.chatMessage.create({ data: { userId, conversationId, role: "user", content: message } });
    } catch {
      dbAvailable = false;
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatStreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      if (!dbAvailable) {
        send({ type: "warning", message: "The database is unavailable, so this conversation won't be saved." });
      }

      try {
        const { finalResponse } = await generateOutfits(
          history,
          message,
          (evt) => {
            if (evt.type === "chunk") send({ type: "chunk", text: evt.text });
            if (evt.type === "retry") send({ type: "retry" });
          },
          closetItems,
        );

        let outfitsWithIds: (typeof finalResponse.outfits[number] & { id: string; isSaved: boolean })[];

        if (dbAvailable) {
          try {
            const created = await Promise.all(
              finalResponse.outfits.map((outfit) =>
                prisma.outfit.create({
                  data: {
                    userId,
                    title: outfit.title,
                    occasion: outfit.occasion,
                    season: outfit.season,
                    itemsByLayer: outfit.itemsByLayer,
                    rationale: outfit.rationale,
                    colorStory: outfit.colorStory,
                    inspirationLinks: outfit.inspirationLinks,
                    isSaved: false,
                  },
                }),
              ),
            );
            await prisma.chatMessage.create({
              data: { userId, conversationId, role: "assistant", content: encodeAssistantContent(created) },
            });
            outfitsWithIds = finalResponse.outfits.map((outfit, i) => ({
              ...outfit,
              id: created[i]!.id,
              isSaved: false,
            }));
          } catch {
            send({ type: "warning", message: "These outfits couldn't be saved because the database is unavailable." });
            outfitsWithIds = finalResponse.outfits.map((outfit, i) => ({
              ...outfit,
              id: `unsaved-${i}-${Date.now()}`,
              isSaved: false,
            }));
          }
        } else {
          outfitsWithIds = finalResponse.outfits.map((outfit, i) => ({
            ...outfit,
            id: `unsaved-${i}-${Date.now()}`,
            isSaved: false,
          }));
        }

        send({ type: "result", outfits: outfitsWithIds });
      } catch (err) {
        if (
          err instanceof GeminiConfigError ||
          err instanceof GeminiRateLimitError ||
          err instanceof GeminiTimeoutError ||
          err instanceof GeminiMalformedOutputError
        ) {
          send({ type: "error", message: err.message });
        } else {
          send({ type: "error", message: "Something unexpected went wrong generating outfits." });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
