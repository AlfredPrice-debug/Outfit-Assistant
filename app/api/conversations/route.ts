import { NextResponse } from "next/server";
import { listArchivedConversations, startNewConversation } from "@/lib/conversation";

export const runtime = "nodejs";

// GET /api/conversations: old (archived) chats, for the chat history page.
// The currently active conversation is deliberately excluded: it's what the
// chat page itself already shows.
export async function GET() {
  try {
    const conversations = await listArchivedConversations();
    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json(
      { error: "The database is unavailable right now, so chat history couldn't be loaded." },
      { status: 503 },
    );
  }
}

// POST /api/conversations: archives whatever chat thread is currently
// active and opens a fresh one.
export async function POST() {
  try {
    await startNewConversation();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "The database is unavailable, so a new chat couldn't be started." },
      { status: 503 },
    );
  }
}
