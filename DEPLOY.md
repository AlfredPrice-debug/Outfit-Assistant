# Deploying Outfit Me to Railway

Follow these steps in order. You'll need a Railway account and a Google account
for Gemini API access. Nothing here requires you to have deployed anything
before.

## 1. Get a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey).
2. Sign in and click **Create API key**.
3. Copy the key somewhere safe — you'll paste it into Railway in step 5. Don't
   commit it to the repo or paste it anywhere public.

Gemini's Google Search grounding (used to get real inspiration links) costs
more per call than an ungrounded call, and Railway itself has no permanent
free tier. Check both services' current pricing pages before leaving the app
running unattended for long periods.

## 2. Push this repo to GitHub

If you haven't already:

```bash
git push -u origin main
```

Railway deploys from a GitHub repo, so this needs to exist before step 3.

## 3. Create the Railway project

1. Go to [railway.app](https://railway.app) and log in.
2. Click **New Project → Deploy from GitHub repo**.
3. Select this repository (`Outfit Assistant`).
4. Railway will detect the Node project via Nixpacks and start a first build.
   It will fail until the environment variables and database are set up
   (steps 4–5) — that's expected, don't troubleshoot it yet.

## 4. Add Railway Postgres and link it

1. In the same Railway project, click **New → Database → Add PostgreSQL**.
2. Open your app service (not the database service) → **Variables** tab.
3. Click **New Variable → Add Reference**, and reference the Postgres
   service's `DATABASE_URL`. Railway will keep this in sync automatically —
   you never type a connection string by hand.

## 5. Create a Google OAuth Client ID

1. Go to the [Google Cloud Console credentials page](https://console.cloud.google.com/apis/credentials)
   and create (or pick) a project.
2. Click **Create credentials → OAuth client ID**, application type **Web
   application**.
3. Under **Authorized redirect URIs**, add both:
   - `http://localhost:3000/api/auth/callback/google` (local dev)
   - `https://<your-railway-domain>/api/auth/callback/google` (production —
     one client covers both at this app's scale)
4. Copy the generated Client ID and Client Secret — you'll paste them into
   Railway in the next step.

## 6. Set the remaining environment variables

Still in the app service's **Variables** tab, add:

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | The key from step 1 |
| `AUTH_SECRET` | Generate with `npx auth secret` (or any random 32+ byte string) |
| `AUTH_GOOGLE_ID` | The Client ID from step 5 |
| `AUTH_GOOGLE_SECRET` | The Client Secret from step 5 |
| `ALLOWED_EMAILS` | Comma-separated emails allowed to sign in, e.g. `you@example.com` |

`DATABASE_URL` should already be present from step 4 as a reference variable.
Confirm all six variables listed in `.env.example` are set before continuing.

## 6. Deploy

1. Trigger a redeploy (Railway does this automatically after variables
   change, or use the **Deploy** button on the service).
2. Watch the build logs. The start command (`npm run start`) runs
   `prisma migrate deploy` before starting the server, so the database schema
   is created automatically on first boot — you don't run migrations by hand.
3. Once deployed, open the service's public URL and confirm `/api/health`
   returns `{"status":"ok"}`. If it returns a 503, the database isn't
   reachable yet — double check step 4.

## 7. Test on your phone

This app is mobile-first, so the real test is on a phone, not a laptop:

1. Open the Railway URL on your phone.
2. Sign in with an allow-listed Google account.
3. Try "summer outfit ideas for a coffee date" from the example chips.
4. Confirm you get three outfit cards, each with items by layer, a rationale,
   and either two working inspiration links or a note that none were found.
5. Save one outfit, then open the same URL on a laptop and confirm it shows
   up on the Saved outfits page — this confirms Postgres is shared correctly
   across devices.

## Troubleshooting

- **Redirected back to `/signin` with "This email isn't approved"**: the
  signed-in Google account isn't in `ALLOWED_EMAILS`. Add it (comma-separated,
  case doesn't matter) and redeploy.
- **`redirect_uri_mismatch` from Google**: the registered redirect URI in the
  Google Cloud Console (step 5) doesn't exactly match the URL Railway is
  actually serving — check scheme (`https://`) and host carefully.
- **Chat says the Gemini key is missing/invalid**: re-check `GEMINI_API_KEY`
  in Railway's Variables tab; a copy-paste with a trailing space is the most
  common cause.
- **Inspiration links look like `vertexaisearch.cloud.google.com/...`
  instead of the publisher's own domain**: this is expected. Google's Search
  grounding returns a redirect link, not the original URL, as of this
  writing — the link still resolves to a real page. See the README's
  "Known limitation" note.
- **Saved outfits page is empty after saving one**: hard refresh — the page
  fetches on load and doesn't currently poll.
