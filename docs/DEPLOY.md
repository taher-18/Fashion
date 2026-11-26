# Deploy checklist (Vercel, free Hobby plan)

Everything in the code is ready. These are the steps only you can do, in order. About 20 minutes.

## 1. Replace the secrets that were shared in chat

These three were pasted in a chat during setup, so make fresh ones before going live.

1. **Supabase secret key:** Supabase → Project Settings → API Keys → **New secret key**. Copy it, then delete the old secret key.
2. **Database password:** Supabase → Database → Settings → **Reset database password**. The app doesn't use it; just keep it somewhere safe.
3. **App password:** choose a new password you'll type on your phone. Use 12+ characters.

Put the new secret key and app password in `.env.local` too, so your local copy keeps working.

## 2. Claude API key (for Auto-tag and Rate my fit)

1. console.anthropic.com → Billing → **Buy credits** ($5 minimum, they expire after 1 year). Leave auto-reload off.
2. Billing → **Spend limits** → set a monthly limit (for example $5).
3. API Keys → **Create key** → copy it. You only see it once.

The app works without this. Only Auto-tag and Rate my fit need it.

## 3. Create the Vercel project

1. vercel.com → **Sign up with GitHub** (Hobby plan, free for personal use).
2. **Add New → Project** → import `taher-18/Fashion`. Framework preset: Next.js (auto-detected). Leave build settings as they are.
3. Before clicking Deploy, open **Environment Variables** and add all six:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nbfbdtbdbggrtatlmcqt.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | the **new** `sb_secret_…` key from step 1 |
| `APP_PASSWORD` | your **new** app password (no quotes needed in Vercel, even with `#`) |
| `SESSION_SECRET` | a new random string: run `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | the key from step 2 (or leave out for now: AI shows "AI is off") |
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` (or `claude-haiku-5-5` to spend less) |

4. Click **Deploy**.
5. After it's live: Project → **Settings → Functions → Function Region** → **Frankfurt (fra1)**, then **Redeploy**. The database is in Frankfurt, so this keeps every screen fast.

## 4. Install on your iPhone

1. Open the `https://<your-project>.vercel.app` link in **Safari** and log in.
2. Share → **Add to Home Screen** → Add.
3. Open it from the Closet icon.

## 5. Final check (from the project brief)

- [ ] Opens from the home-screen icon, full-screen
- [ ] Log in works
- [ ] Closet shows your 37 items
- [ ] Today → **Date night** + **Mild** shows 3 picks
- [ ] (With the API key) Add → photo → Auto-tag fills the form
- [ ] (With the API key) Rate → selfie → score and swaps

## Later changes

- Every push to `main` on GitHub redeploys automatically.
- To change a setting (for example the AI model): Vercel → Settings → Environment Variables → edit → **Redeploy**.
- Free Supabase projects pause after about a week with no use. If the app says it can't reach the database, open the Supabase dashboard and click **Restore**.
