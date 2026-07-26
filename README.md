# OutFit Me

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

- **Chat.** Describe an occasion, season, or vibe — optionally with a photo
  of a garment attached — and get three outfit cards back, streamed in as
  they generate.
- **Outfit cards.** Each opens with a color story bar (the outfit's actual
  garment colors), then the title, items grouped by layer as text, a short
  rationale, and up to two inspiration links styled as buttons that open in
  a new tab.
- **Photo input.** Attach a photo of a piece you own (via the image icon in
  the chat input) and Gemini builds at least one outfit around it. The photo
  is compressed client-side and sent for that one request only — it's never
  stored, so it won't reappear after a reload.
- **Outfit MC.** The assistant has a name and a persona: she introduces
  herself at the start of every new chat. Pick her headshot (6 options) and
  your own avatar (18 options) on the profile page (saved to this browser
  only — see [Data model](#data-model)).
- **My closet.** Log what you already own (category, color, description) on
  the profile page. Nothing reads this yet — see
  [Planned for v2](#planned-for-v2-closet-awareness) — but it's there to log
  against today.
- **Save.** Toggle any outfit to save it; revisit it from the Saved outfits
  page, filterable by occasion and season, from any device.
- **New chat.** Start a fresh conversation from the sidebar menu; the old one
  is archived, not deleted, so it stays in the database but stops being what
  the chat page loads.
- **Chat history.** Old (archived) chats live on the `/history` page. Resume
  one to swap it back to active, or delete it for good.
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
5. Open `http://localhost:3000`, enter your `APP_PASSCODE`, and describe an
   occasion to Outfit MC.

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

Four Prisma models, all defined in `prisma/schema.prisma`:

- **`Conversation`** — `id`, `userId`, `isArchived`, `createdAt`. A chat
  thread. Exactly one non-archived conversation exists per user at a time;
  "Start new chat" in the sidebar archives it and creates a new one, so old
  messages stay in the database instead of being deleted — they just stop
  being the thread the chat page loads.
- **`ChatMessage`** — `id`, `userId`, `conversationId`, `role` (`"user"` or
  `"assistant"`), `content`, `createdAt`. The full transcript of one
  conversation. Assistant turns store a compact pointer
  (`{ outfitIds, titles }`) rather than the full outfit JSON, so the outfit's
  `isSaved` state — read live from `Outfit` — never drifts out of sync with
  what's shown in chat history.
- **`Outfit`** — `id`, `userId`, `title`, `occasion`, `season`,
  `itemsByLayer` (JSON), `rationale`, `colorStory` (JSON), `inspirationLinks`
  (JSON), `isSaved`, `createdAt`. Every outfit Gemini generates is written
  here immediately, not just the ones you save — that's what lets "unsave" be
  a flag flip instead of a delete, and what the Saved outfits page filters
  against. `colorStory` is 3-5 `{ name, hex }` entries driving the card's
  color story bar — unlike `inspirationLinks`, these are trusted straight
  from the model (Zod validates the hex format, not the color choice), since
  there's no external source of truth for "what color is this cardigan".
  Outfits aren't scoped to a conversation — saving one and starting a new
  chat doesn't affect it.
- **`ClosetItem`** — `id`, `userId`, `category`, `colorName`, `description`,
  `createdAt`. Logged from the "My closet" section of the profile page
  (`/api/closet`). Nothing else reads it yet — see
  [Planned for v2](#planned-for-v2-closet-awareness).

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

The system prompt also names the persona ("You are Outfit MC") and instructs
the model to never use an em dash in its output, matching a house style rule
applied everywhere else in this app's own copy.

**Known limitation:** grounding chunk URIs point at Google's
`vertexaisearch.cloud.google.com` grounding-redirect service rather than the
publisher's own URL, and this is true across current API versions, not a bug
in this app. The link still resolves to a real page — it's just a redirect,
not a direct link — so it satisfies "never fabricate a URL" without being the
prettiest possible URL to show a user.

## Multimodal input

The chat input's photo icon lets you attach a picture of a garment. It's
downscaled and compressed to a small JPEG in the browser
(`lib/client/compressImage.ts`) before it ever leaves the device, then sent
as inline image data alongside the text for that one Gemini call only — it
is never written to the database, so it won't reappear after a reload (this
app has no object storage; see `attachedImageSchema` in `lib/schemas.ts` for
the size/type limits enforced server-side too).

## Avatars

`lib/avatars.ts` is the source of truth for every avatar in the app. Both
sides are user-selectable, picked on a dedicated `/profile` page reachable by
tapping the avatar in the header or via "Profile" in the sidebar menu from
anywhere in the app:

- **`USER_AVATARS`**: 18 illustrated character icons standing in for the
  human user, who has no profile photo in this app.
- **`ASSISTANT_AVATARS`**: 6 looks for Outfit MC, the assistant's persona.
  Each option is really a pair: a normal `src` and a matching `thinkingSrc`
  cropped from a second sheet of the same look in a "thinking" pose. Picking
  a look picks both at once, so the pending/thinking indicator always shows
  the correct pose for whichever look is active, not a mismatched one.

Both choices are stored in `localStorage`, not the database. There's no
`User` model to attach either to, and they're cosmetic enough not to need
one. Every visible chat bubble reflects the *current* choice (not a
per-message snapshot), so switching avatars re-skins the whole conversation
on screen immediately, not just future messages.

One gotcha worth documenting: `next/image` optimizes local images by
internally re-running the request through this app's own middleware. The
first fix for this excluded `/avatars` specifically from the passcode-gate
matcher; adding the clothing icon set (see below) hit the exact same 400 on
`/clothing` and made clear that was the wrong shape of fix. `middleware.ts`
now excludes any request path with a file extension in one rule instead of
naming each `/public` subfolder — a future `/public/whatever/*.png` won't
silently reintroduce this. Self-hosted `next/image` also requires the
`sharp` package at runtime (in `dependencies`, not `devDependencies` — it
must survive a production-only install) or every optimized image silently
fails the same way.

## Sidebar and new chat

`components/Sidebar.tsx` is a slide-out drawer, toggled by the hamburger
button in the sticky header, present on every page. It holds the app's real
navigation: "Start new chat", "Profile", and "Chat history". Starting a new
chat calls `POST /api/conversations`, which archives the current
`Conversation` row and creates a new one (see [Data model](#data-model)),
then does a full page navigation back to `/` — a plain client-side route
push wouldn't re-run the chat page's history fetch since it only runs once,
on mount.

## Chat history

The `/history` page lists archived conversations (`lib/conversation.ts`,
`listArchivedConversations`), each previewed by its first user message. Two
actions, both driven by `/api/conversations/[id]`:

- **Resume** (`PATCH`): archives whatever conversation is currently active
  and un-archives the chosen one in its place, a two-way swap rather than a
  one-way restore. A full page navigation back to `/` follows, for the same
  reason "Start new chat" does one: the chat page's history fetch only runs
  once, on mount.
- **Delete** (`DELETE`): permanently removes the conversation and its
  `ChatMessage` rows in one transaction. Outfits generated during it are
  untouched, since `Outfit` rows aren't scoped to a conversation.

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

The "My closet" section of the profile page (`components/ClosetSection.tsx`,
`/api/closet`) already lets you log what you own — category, color, a short
description — as `ClosetItem` rows (no photo upload, no image recognition).
What's still planned:

- The Gemini prompt in `lib/gemini.ts` gains a second context block listing
  the user's closet items, with an instruction to prefer assembling outfits
  from what's already listed, only reaching for a generic suggestion when
  nothing on hand fits.
- Outfit cards gain a badge distinguishing "from your closet" items from
  "you'd need to get this" items.

Because `ClosetItem` already carries `userId` and a migration-safe shape,
building this is additive work against `lib/gemini.ts` and `OutfitCard.tsx` —
it doesn't require touching `ChatMessage`, `Conversation`, or `Outfit`, and it
doesn't require a migration against tables that already hold real data.
