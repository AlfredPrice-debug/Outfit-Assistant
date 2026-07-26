import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";
import { createSessionValue, passcodesMatch, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export const runtime = "nodejs";

const ATTEMPT_LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

const bodySchema = z.object({ passcode: z.string().min(1) });

function clientKey(req: NextRequest): string {
  // Railway (and most PaaS front doors) set x-forwarded-for; falling back to
  // a constant just means attempts share one bucket, which is still a limit.
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  const appPasscode = process.env.APP_PASSCODE;
  if (!appPasscode) {
    return NextResponse.json(
      { error: "APP_PASSCODE is not configured on the server." },
      { status: 500 },
    );
  }

  const key = clientKey(req);
  const { allowed, retryAfterSeconds } = checkRateLimit(key, ATTEMPT_LIMIT, WINDOW_MS);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A passcode is required." }, { status: 400 });
  }

  // Never log `parsed.data.passcode`, not here, not in an error handler above.
  const isMatch = await passcodesMatch(parsed.data.passcode, appPasscode);
  if (!isMatch) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  resetRateLimit(key);
  const sessionValue = await createSessionValue(appPasscode);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
