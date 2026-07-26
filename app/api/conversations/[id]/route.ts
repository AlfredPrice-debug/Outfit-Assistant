import { NextRequest, NextResponse } from "next/server";
import { deleteConversation, resumeConversation } from "@/lib/conversation";

export const runtime = "nodejs";

// PATCH /api/conversations/[id]: resume an archived chat. It becomes the
// active conversation, and whatever was active gets archived in its place.
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const count = await resumeConversation(params.id);
    if (count === 0) {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "The database is unavailable, so this chat couldn't be resumed." },
      { status: 503 },
    );
  }
}

// DELETE /api/conversations/[id]: permanently removes a chat and its
// messages. Outfits generated during it aren't touched (see README).
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const count = await deleteConversation(params.id);
    if (count === 0) {
      return NextResponse.json({ error: "Chat not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "The database is unavailable, so this chat couldn't be deleted." },
      { status: 503 },
    );
  }
}
