# CLAUDE.md: Closet (Taher's personal stylist app)

## What this is
A personal, single-user web app that stores Taher's clothes and picks outfits for him.
Owner: Taher (GUC student, Cairo). Uses it mostly on iPhone.
Full spec: docs/SPEC.md. Style rules: docs/STYLE_RULES.md. Seed closet: docs/seed/wardrobe.json.

## Stack (locked, do not change without asking)
- Next.js 14+ App Router, TypeScript (strict), Tailwind CSS
- Supabase: Postgres for data, Storage bucket `clothes` for photos
- `@supabase/supabase-js` as the only DB client
- `@anthropic-ai/sdk` for Claude API (vision + suggestions)
- `zod` for validating API input and AI JSON output
- `lucide-react` for icons
- Deploy: Vercel. Repo: GitHub.

Allowed extra deps without asking: none. Ask first for anything else.

## Env vars (.env.example lists names only)
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=      # server only, never sent to the browser
ANTHROPIC_API_KEY=              # optional; AI features turn off without it
ANTHROPIC_MODEL=                # e.g. the current Claude Sonnet model id; read from env, don't hardcode
APP_PASSWORD=                   # single-user login
SESSION_SECRET=                 # signs the login cookie
```

## Rules
- All DB and Storage access happens in server code (route handlers / server actions) with the service role key. The browser never talks to Supabase directly.
- Login: one password form, signed httpOnly cookie, middleware protects every route except /login.
- Mobile-first. Test every screen at 390px. Tap targets at least 44px.
- Light and dark mode via Tailwind `dark:` following the system setting.
- The outfit engine lives in `lib/engine/` as pure TypeScript functions with no I/O, so it can be unit tested. Write tests for it with Node's built-in test runner (`node --test`) via tsx, or Vitest only if I approve it.
- AI calls live in `lib/ai/`. Every AI response must be requested as JSON and parsed with zod. On a parse failure, retry once, then show a friendly error.
- Images: resize on the client to max 1280px JPEG before upload to keep Storage small.
- Keep components small. No component library. Tailwind only.
- Copy tone: casual, short, plain English. Example: "Best pick", "In wash", "Wore it".

## Folder layout
```
app/                 routes (login, closet, closet/[id], add, outfits, rate, history, settings)
app/api/             route handlers
components/          UI pieces
lib/engine/          outfit scoring (pure)
lib/ai/              Claude API calls + zod schemas
lib/db/              Supabase queries
supabase/schema.sql  tables + seed loader
docs/                spec, rules, wardrobe
```

## Commands
- `npm run dev`, `npm run build`, `npm run lint`, `npm test`
