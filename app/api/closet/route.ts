import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnerId } from "@/lib/owner";
import { closetItemInputSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await getOwnerId();
    const items = await prisma.closetItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "The database is unavailable right now, so your closet couldn't be loaded." },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = closetItemInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A category, color, and description are required." }, { status: 400 });
  }

  try {
    const userId = await getOwnerId();
    const item = await prisma.closetItem.create({ data: { userId, ...parsed.data } });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json(
      { error: "The database is unavailable, so this couldn't be saved." },
      { status: 503 },
    );
  }
}
