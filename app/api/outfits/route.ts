import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnerId } from "@/lib/owner";

export const runtime = "nodejs";

// GET /api/outfits?occasion=&season=: saved outfits only, newest first.
// Filters are exact-match (values come from a <select> populated with the
// distinct occasions/seasons already saved, not free text).
export async function GET(req: NextRequest) {
  const occasion = req.nextUrl.searchParams.get("occasion") || undefined;
  const season = req.nextUrl.searchParams.get("season") || undefined;

  try {
    const userId = getOwnerId();
    const outfits = await prisma.outfit.findMany({
      where: {
        userId,
        isSaved: true,
        ...(occasion ? { occasion } : {}),
        ...(season ? { season } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ outfits });
  } catch {
    return NextResponse.json(
      { error: "The database is unavailable right now, so saved outfits couldn't be loaded." },
      { status: 503 },
    );
  }
}
