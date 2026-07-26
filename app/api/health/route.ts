import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
// Without this, Next.js has no request-dependent API to key off and would
// statically render the route at build time, baking in whatever the
// database's health happened to be during `next build`, forever.
export const dynamic = "force-dynamic";

// Railway hits this on every deploy to decide whether the new instance is
// ready to receive traffic, so it must not require the passcode cookie
// (see middleware.ts) and must fail loudly if the database can't be reached.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error", reason: "database unavailable" }, { status: 503 });
  }
}
