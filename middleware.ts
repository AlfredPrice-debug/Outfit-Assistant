import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isTestBypassActive } from "@/lib/owner";

// Runs on every request that matches `config.matcher` below, before any page
// or route handler. /signin, /api/auth, and /api/health are excluded there
// because they have to be reachable without a session: /signin is how you
// get one, /api/auth is what issues it, and /api/health is hit by Railway's
// health checker, which never carries a session.
//
// Any static file under /public (avatars, clothing icons, future additions)
// is excluded too, since next/image's optimizer fetches local images by
// internally re-running the request through this same middleware with no
// session attached, so without this every optimized image 400s in
// production. Matching "has a file extension" once, instead of listing each
// public subfolder by name, means a new /public/whatever/*.png doesn't
// silently reintroduce this bug.
export default auth((req) => {
  if (isTestBypassActive() || req.auth) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const signInUrl = new URL("/signin", req.url);
  signInUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|signin|api/auth|api/health|.*\\.[a-zA-Z0-9]+$).*)"],
};
