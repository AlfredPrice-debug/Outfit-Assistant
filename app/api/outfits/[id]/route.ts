import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOwnerId } from "@/lib/owner";

export const runtime = "nodejs";

const bodySchema = z.object({ isSaved: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "isSaved (boolean) is required." }, { status: 400 });
  }

  try {
    const userId = await getOwnerId();
    const { count } = await prisma.outfit.updateMany({
      where: { id: params.id, userId },
      data: { isSaved: parsed.data.isSaved },
    });
    if (count === 0) {
      return NextResponse.json({ error: "Outfit not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "The database is unavailable, so this couldn't be saved." },
      { status: 503 },
    );
  }
}
