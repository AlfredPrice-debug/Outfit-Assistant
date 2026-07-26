# Outfit Me

A single-user web app that turns a plain-language request — "summer outfit
ideas for a coffee date" — into three concrete, wearable outfit suggestions,
each with real inspiration links. No video feed to reverse-engineer, no
scrolling: you describe an occasion and get back an outfit you can actually
put together from clothes you likely already own.

Outfit Me does **not** know what's in your closet in v1. Suggestions
come from Gemini's general fashion knowledge, grounded in live Google Search
results so the inspiration links are real pages, not invented URLs. See
[Planned for v2](#planned-for-v2-closet-awareness) below.

## What it does

- **Chat.** Describe an occasion, season, or vibe. Get three outfit cards
  back, streamed in as they generate.
- **Outfit cards.** Each shows a title, items grouped by layer (top, bottom,
  outerwear, shoes, accessories), a short rationale, and up to two inspiration
  links that open in a new tab.
- **Save.** Toggle any outfit to save it; revisit it from the Saved outfits
  page, filterable by occasion and season, from any device.
- **Persisted history.** Your conversation survives a reload and a redeploy.
- **One passcode.** The whole app sits behind a single shared passcode —
  there's no per-user login because there's only one user.

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in all four variables (see below).
   You'll need a local Postgres database — `DATABASE_URL` should point at it.
3. Apply the schema:
   ```bash
   npx prisma migrate dev
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`, enter your `APP_PASSCODE`, and try one of
   the example prompts.

## Environment variables

All four are required — the app fails with a readable error rather than a
blank screen if one is missing. See `.env.example` for the same list with
inline comments.

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Server-side only. Never sent to the client, never logged, never returned in a response body. All Gemini calls happen inside route handlers (`app/api/chat/route.ts`). |
| `DATABASE_URL` | Postgres connection string. Railway injects this automatically once you link a Postgres instance (see `DEPLOY.md`). |
| `APP_PASSCODE` | The shared passcode gating the entire app. Rotating it instantly invalidates every existing session, since the session cookie is signed with this value (see `lib/session.ts`). |
| `OWNER_ID` | A stable string tagging every database row. See [Data model](#data-model) for why this exists even though there's only one user. |

## Data model

Three Prisma models, all defined in `prisma/schema.prisma`:

- **`ChatMessage`** — `id`, `userId`, `role` (`"user"` or `"assistant"`),
  `content`, `createdAt`. The full transcript. Assistant turns store a
  compact pointer (`{ outfitIds, titles }`) rather than the full outfit JSON,
  so the outfit's `isSaved` state — read live from `Outfit` — never drifts out
  of sync with what's shown in chat history.
- **`Outfit`** — `id`, `userId`, `title`, `occasion`, `season`,
  `itemsByLayer` (JSON), `rationale`, `colorStory` (JSON), `inspirationLinks`
  (JSON), `isSaved`, `createdAt`. Every outfit Gemini generates is written
  here immediately, not just the ones you save — that's what lets "unsave" be
  a flag flip instead of a delete, and what the Saved outfits page filters
  against. `colorStory` is 3-5 `{ name, hex }` entries driving the card's
  color story bar — unlike `inspirationLinks`, these are trusted straight
  from the model (Zod validates the hex format, not the color choice), since
  there's no external source of truth for "what color is this cardigan".
- **`ClosetItem`** — `id`, `userId`, `category`, `colorName`, `description`,
  `createdAt`. The table exists and nothing else does: no route, no query, no
  UI touches it in this codebase. See below.

Every model carries `userId`, populated from `OWNER_ID` on every write. There's
no `User` model and no auth relation — this is deliberately a config value,
not a foreign key — so that adding real multi-user accounts later is a schema
addition (a `User` table, a session tied to a real account) plus a query-layer
change, not a migration that has to backfill ownership onto years of existing
rows.

## How Gemini grounding works here

`lib/gemini.ts` calls Gemini with the `googleSearch` tool enabled so
inspiration links come from real search results. One deliberate constraint
shaped the implementation: **grounding and structured JSON output
(`responseSchema` / `responseMimeType: "application/json"`) don't reliably
compose** — enabling both on the same call causes grounding metadata to come
back empty. So this app never sets `responseSchema`; instead:

1. Gemini is instructed (via system prompt) to return raw JSON matching the
   outfit shape, with no `inspirationLinks` field at all — the model is never
   asked for URLs, so it can never be the source of a fabricated one.
2. The real links come from `groundingMetadata.groundingChunks` on the
   response, deduplicated by URL and handed out two-per-outfit in order.
3. The model's JSON is validated with Zod. If it fails (wrong shape, missing
   fields, stray commentary around the JSON), the call retries once with a
   stricter instruction before surfacing an error to the user.

**Known limitation:** grounding chunk URIs point at Google's
`vertexaisearch.cloud.google.com` grounding-redirect service rather than the
publisher's own URL, and this is true across current API versions, not a bug
in this app. The link still resolves to a real page — it's just a redirect,
not a direct link — so it satisfies "never fabricate a URL" without being the
prettiest possible URL to show a user.

## Failure states

Handled visibly, not silently, per the project brief:

- Missing/invalid `GEMINI_API_KEY` → a specific in-app message, not a 500 page.
- Gemini rate limit/quota (HTTP 429) → a specific message asking you to retry.
- Network timeout (30s) → a specific timeout message.
- Malformed model output → one silent retry, then a specific error.
- Database unavailable → a dismissible warning banner; the chat/outfit
  request still completes where possible, it just can't be saved.

## Deploying

See [`DEPLOY.md`](./DEPLOY.md) for the exact, ordered Railway setup — creating
the project, linking Postgres, setting variables, and verifying the deploy.

## Planned for v2: closet awareness

The `ClosetItem` model (`id`, `userId`, `category`, `colorName`, `description`,
`createdAt`) already exists in the schema and migration, but nothing in the
app reads or writes it yet. The plan for v2:

- A simple form (no photo upload, no image recognition) where you log what
  you own — "navy chinos", "white sneakers" — as `ClosetItem` rows.
- The Gemini prompt in `lib/gemini.ts` gains a second context block listing
  the user's closet items, with an instruction to prefer assembling outfits
  from what's already listed, only reaching for a generic suggestion when
  nothing on hand fits.
- Outfit cards gain a badge distinguishing "from your closet" items from
  "you'd need to get this" items.

Because `ClosetItem` already carries `userId` and a migration-safe shape,
building this is additive work against `lib/gemini.ts` and a new route/page —
it doesn't require touching `ChatMessage` or `Outfit`, and it doesn't require
a migration against tables that already hold real data.
