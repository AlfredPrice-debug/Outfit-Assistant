// Session signing for the passcode gate. Built on Web Crypto (crypto.subtle)
// rather than Node's `crypto` module because this code runs in middleware.ts,
// which Next.js always executes on the Edge runtime. Node's crypto module
// isn't available there, but crypto.subtle is available in both Edge and
// Node 20+, so one implementation covers both call sites.
export const SESSION_COOKIE_NAME = "outfit_session";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
export const SESSION_MAX_AGE_SECONDS = MAX_AGE_MS / 1000;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return toHex(signature);
}

async function sha256Hex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(message));
  return toHex(digest);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// Comparing fixed-length digests (rather than the raw strings) means a
// shorter guess doesn't finish the comparison loop early, so the response
// time doesn't leak the correct passcode's length.
export async function passcodesMatch(submitted: string, actual: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256Hex(submitted), sha256Hex(actual)]);
  return timingSafeEqualHex(a, b);
}

// Cookie value is `<issuedAt>.<hmac(issuedAt, passcode)>`. Verifying against
// the current APP_PASSCODE (rather than a separate session secret) means
// rotating the passcode instantly invalidates every existing session; there
// is nothing extra to rotate.
export async function createSessionValue(passcode: string): Promise<string> {
  const issuedAt = String(Date.now());
  const sig = await hmacSha256Hex(passcode, issuedAt);
  return `${issuedAt}.${sig}`;
}

export async function verifySessionValue(value: string | undefined, passcode: string): Promise<boolean> {
  if (!value) return false;
  const [issuedAt, sig] = value.split(".");
  if (!issuedAt || !sig) return false;
  const issuedAtMs = Number(issuedAt);
  if (!Number.isFinite(issuedAtMs)) return false;
  const age = Date.now() - issuedAtMs;
  if (age < 0 || age > MAX_AGE_MS) return false;
  const expected = await hmacSha256Hex(passcode, issuedAt);
  return timingSafeEqualHex(sig, expected);
}
