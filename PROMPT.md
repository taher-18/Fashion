# Prompt to paste into Claude Code

Put this whole folder (CLAUDE.md + docs/) in an empty project folder first, open Claude Code there, then paste everything below the line.

---

<context>
I'm Taher, a final-year MET student at GUC (Cairo). I know React, Node/Express, MongoDB, React Native, SQL and Python. I want a personal stylist web app for myself only: I save my clothes, tell it where I'm going, and it gives me outfit picks with short reasons. It can also look at a mirror selfie and rate the fit.

Everything you need is already in this folder. Read these files first, in this order, before writing any code:
1. CLAUDE.md: project rules and stack (follow them strictly)
2. docs/SPEC.md: features, screens, data model, API routes, build phases
3. docs/STYLE_RULES.md: the styling rules the suggestion engine must follow
4. docs/WARDROBE.md and docs/seed/wardrobe.json: my real closet, used as seed data
</context>

<task>
Build the app described in docs/SPEC.md, one phase at a time, starting with Phase 1. After each phase, stop, show me what works, and give me the exact commands to run it locally. Wait for my "go" before starting the next phase.
</task>

<constraints>
- MUST use the stack in CLAUDE.md: Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres + Storage), Claude API for vision and suggestions, deployed on Vercel.
- Single user only: one password login stored as an env var (APP_PASSWORD). No sign-up, no multi-user, no social features.
- Mobile-first: I use it on my iPhone 95% of the time. Every screen MUST work at 390px wide. Make it installable as a PWA (home-screen icon).
- Secrets ONLY in .env.local and Vercel env vars. NEVER hardcode keys. Create .env.example with variable names only.
- The rule-based outfit engine (docs/STYLE_RULES.md) MUST work with no AI call. The Claude API is used only for: auto-tagging an uploaded clothing photo, rating a mirror selfie, and an optional "ask the stylist" chat. If ANTHROPIC_API_KEY is missing, those features show a clear "AI is off" message and everything else still works.
- Only build what is in docs/SPEC.md. Do not add features, pages, or libraries that aren't listed.
- Keep it simple: no state-management libraries, no ORMs beyond the Supabase JS client, no component kits besides what CLAUDE.md allows.
</constraints>

<stop_and_ask>
Stop and ask me before you:
- add any npm dependency not listed in CLAUDE.md
- change the database schema after Phase 1 is done
- delete any file you didn't create in this session
- run anything that deploys, pushes to GitHub, or touches my Supabase/Vercel account
- spend more than 3 attempts fixing the same error (show me the error instead)
</stop_and_ask>

<done_when>
Each phase is done when:
- `npm run build` passes with zero TypeScript errors
- `npm run lint` passes
- the phase's checklist in docs/SPEC.md is all true, and you show me the evidence (command output or what I'll see on screen)
The whole project is done when Phase 5 is deployed on Vercel and I can open it on my phone, log in, see my seeded closet, and get 3 outfit picks for "Date night" + "Mild".
</done_when>

<output_format>
At the end of each phase, reply with:
1. What you built (bullet list, max 8 lines)
2. Files changed
3. Commands for me to run
4. Anything I need to do by hand (e.g. create a Supabase bucket, set an env var), as numbered steps in plain words
5. What's next
</output_format>
