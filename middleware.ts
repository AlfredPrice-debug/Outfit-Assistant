import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionValue } from "@/lib/session";

// Runs on every request that matches `config.matcher` below, before any page
// or route handler. /gate, /api/auth, and /api/health are excluded there
// because they have to be reachable without a session: /gate is how you get
// one, /api/auth is what issues it, and /api/health is hit by Railway's
// health checker, which never carries our cookie. /avatars is excluded
// because next/image's optimizer fetches local images by internally
// re-running them through this same middleware with no cookie attached —
// without the exclusion, every optimized avatar 400s in production.
export async function middleware(req: NextRequest) {
  const appPasscode = process.env.APP_PASSCODE;

  // Fail visibly rather than either locking everyone out or silently
  // skipping the gate when the operator forgot to set APP_PASSCODE.
  if (!appPasscode) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "APP_PASSCODE is not configured on the server." },
        { status: 500 },
      );
    }
    return NextResponse.redirect(new URL("/gate?error=config", req.url));
  }

  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionValue(cookie, appPasscode);
  if (valid) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const gateUrl = new URL("/gate", req.url);
  gateUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(gateUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|avatars|gate|api/auth|api/health).*)"],
};
