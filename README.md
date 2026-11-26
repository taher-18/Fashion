# Closet

Taher's personal stylist app. Save your clothes, say where you're going and what the weather's like, and get the 3 best outfits from your own closet with a short reason each. Snap a mirror selfie and get a verdict on the fit.

- Rules for building it: [`CLAUDE.md`](CLAUDE.md)
- Features, screens, data model and phases: [`docs/SPEC.md`](docs/SPEC.md)
- The styling rules the outfit engine follows: [`docs/STYLE_RULES.md`](docs/STYLE_RULES.md)
- Seed closet: [`docs/seed/wardrobe.json`](docs/seed/wardrobe.json)

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind 4 · Supabase (Postgres + private Storage bucket `clothes`) · Claude API for vision · Vercel.

## Screens

| Screen | Path | Needs AI? |
|---|---|---|
| Today: occasion + weather → 3 outfit picks | `/` | No |
| Closet grid with filters | `/closet` | No |
| Item detail: In wash, edit, delete, times worn | `/closet/[id]` | No |
| Add item (photo + manual entry, optional Auto-tag) | `/add` | Auto-tag only |
| Rate my fit (mirror selfie → score, fixes, swaps) | `/rate` | Yes |
| History with thumbs up/down | `/history` | No |

## Setup (first time)

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:

   | Variable | Where to get it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Connect, or Settings → Data API (`https://<project-id>.supabase.co`) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API Keys → **Secret** key (`sb_secret_…`). Server only. |
   | `APP_PASSWORD` | The password you log in with. Wrap it in quotes if it contains `#`. |
   | `SESSION_SECRET` | Any random string, 16+ characters: `openssl rand -base64 32` |
   | `ANTHROPIC_API_KEY` | Optional. console.anthropic.com → API Keys. Without it, AI features show "AI is off". |
   | `ANTHROPIC_MODEL` | Optional. The Claude model id, for example `claude-sonnet-5-5` (or `claude-opus-5-5` for the strongest results). |

3. In Supabase → SQL Editor → New query, paste `supabase/schema.sql` and run it (safe to re-run).
4. `npm run seed` loads the occasions and the closet from `docs/seed/wardrobe.json` (safe to re-run; never duplicates).
5. `npm run dev` and open http://localhost:3000

To use it on your iPhone on the same Wi-Fi: `npm run dev -- -H 0.0.0.0`, then open `http://<your-mac-ip>:3000` (find the IP with `ipconfig getifaddr en0`).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with live reload |
| `npm run build` | Production build (type checks everything) |
| `npm run lint` | ESLint |
| `npm test` | Outfit engine tests (Node's built-in runner, no extra deps) |
| `npm run seed` | Load occasions + seed closet into Supabase |

## How the pieces fit

- `lib/engine/`: the outfit engine. Pure TypeScript, no AI, no I/O. Builds every outfit the weather allows, scores each with the rules in `docs/STYLE_RULES.md`, applies your history (recent repeats, thumbs up/down), and returns the top 3 that differ by at least 2 pieces.
- `lib/ai/`: the Claude calls (`tagItem`, `rateFit`). Every answer is requested as JSON and checked with zod; one retry on a messy answer. Rate my fit sends your closet as a short list, and the schema only allows ids from that list, so swaps always point to real items.
- `lib/db/`: Supabase queries. All database and Storage access happens on the server with the service role key; the browser never talks to Supabase directly.
- `proxy.ts`: the login check (Next 16's name for middleware). Every page and API except `/login` needs the signed cookie.

## Privacy

- Photos live in a **private** Supabase bucket and are shown through links that expire after an hour.
- Auto-tag and Rate my fit send the photo to the Claude API. Selfies are stored under `selfies/` in the same private bucket, with the verdict in the `fit_checks` table.
- Secrets live only in `.env.local` (git-ignored) and Vercel's environment variables.

## Troubleshooting

- **A page shows an error about a file you know exists, or "Hydration failed":** the dev server is holding stale files. Stop it, run `rm -rf .next/dev`, start it again. Don't run `npm run build` while `npm run dev` is running.
- **"Operation not permitted" in Terminal:** macOS is blocking Terminal from the Desktop folder. System Settings → Privacy & Security → Files & Folders → Terminal → turn on Desktop Folder, then quit and reopen Terminal.
- **Changed `.env.local` but nothing changed:** restart `npm run dev`.
- **"AI is off":** set both `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`, then restart.
