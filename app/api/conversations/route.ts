import { NextResponse } from "next/server";
import { startNewConversation } from "@/lib/conversation";

export const runtime = "nodejs";

// POST /api/conversations — archives whatever chat thread is currently
// active and opens a fresh one. This is the only verb this resource needs:
// there's no client-facing read/list/delete of conversations in this app.
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
