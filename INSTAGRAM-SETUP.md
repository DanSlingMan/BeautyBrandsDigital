# Instagram Feed Setup — cltmakeup.com

The homepage "Follow along" strip pulls Miriam's 6 latest posts live from
Instagram. The code is already deployed — it just needs a one-time setup to
get an access token. Until then, the blush placeholder tiles show (nothing
breaks).

## Step 1 — Make @clt_makeup1 a Professional account (Miriam, ~2 min)

Instagram's API only works with Professional accounts (Creator or Business).
It's free and her profile barely changes.

In the Instagram app: **Settings → Account type and tools → Switch to
professional account → Creator** (category: e.g. "Makeup Artist").

## Step 2 — Create a Meta app and get a token (~15 min)

1. Go to https://developers.facebook.com and log in (a Facebook account is
   required — Miriam's, or yours with her present to authorize).
2. **Create App** → choose the **Instagram** use case ("API setup with
   Instagram business login").
3. In the app dashboard under **Instagram → API setup with Instagram business
   login**, find **Generate access tokens** and click **Add account** — log in
   as @clt_makeup1 and authorize.
4. Click **Generate token**, copy it. This is a **long-lived token (60 days)**.

The app can stay in Development mode — reading your own account's media
works without App Review.

## Step 3 — Add the token to Netlify (~2 min)

Netlify dashboard → site → **Site configuration → Environment variables**:

| Variable | Value |
|---|---|
| `INSTAGRAM_ACCESS_TOKEN` | the token from Step 2 |

Then trigger a redeploy (or just wait for the next git push). The homepage
strip will start showing real posts.

## Step 4 (optional but recommended) — Automatic token refresh

Tokens die after 60 days. A scheduled function
(`netlify/functions/instagram-refresh.js`) renews it on the 1st and 15th of
each month, but it needs permission to update the env var. Add two more
environment variables:

| Variable | Where to get it |
|---|---|
| `NETLIFY_AUTH_TOKEN` | Netlify → User settings → Applications → New access token |
| `NETLIFY_SITE_ID` | Netlify → Site configuration → Site details → Site ID |

If you skip this, just repeat Steps 2.4 and 3 every ~8 weeks.

## How it works

- `netlify/functions/instagram-feed.js` — fetches the 6 latest posts
  server-side (token never reaches the browser), cached 1 hour
- `js/instagram.js` — swaps the homepage placeholder tiles for real images,
  each linking to its post
- `netlify/functions/instagram-refresh.js` — keeps the token alive

## Troubleshooting

- **Placeholders still showing** — open
  `https://cltmakeup.com/.netlify/functions/instagram-feed` directly. A JSON
  error message will say whether the token is missing, expired, or invalid.
- **Token expired** — regenerate (Step 2.4), update the env var, redeploy.
- **Check refresh runs** — Netlify dashboard → Logs → Functions →
  `instagram-refresh`.
