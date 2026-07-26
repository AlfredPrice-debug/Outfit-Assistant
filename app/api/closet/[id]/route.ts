import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnerId } from "@/lib/owner";

export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getOwnerId();
    const { count } = await prisma.closetItem.deleteMany({ where: { id: params.id, userId } });
    if (count === 0) {
      return NextResponse.json({ error: "Closet item not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "The database is unavailable, so this couldn't be removed." },
      { status: 503 },
    );
  }
}
