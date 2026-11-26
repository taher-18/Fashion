# SPEC: Closet

## Goal
Taher opens the app, says where he's going and what the weather is, and gets the 3 best outfits from his own clothes with a one-line reason each. He can also snap a mirror selfie and get a verdict ("looks good / swap the pants for X").

## Users
Only Taher. One password. No accounts.

## Screens
1. **Login**: password field, "Enter" button.
2. **Today** (home): occasion chips, weather chips, optional "Build around" item picker, then 3 outfit cards. Each card shows the pieces (photo thumbnails or color swatches), a "Best pick / Second / Third" badge, up to 3 green reasons and 2 orange warnings, and buttons "I'm wearing this" and "Not this".
3. **Closet**: grid of items grouped by category (Tops, Mid layers, Jackets, Pants, Shoes, Accessories). Filters: category, color, "In wash". Tap an item to open it.
4. **Item detail**: photo, name, brand, category, color, formality (1 to 5), warmth (1 to 5), fit, notes, "In wash" toggle, edit, delete (with an in-page confirm step), "Times worn" and "Last worn".
5. **Add item**: take or upload a photo, then "Auto-tag with AI" fills name, category, color, brand guess, formality, warmth. Taher edits anything before saving. Manual entry works without AI.
6. **Rate my fit**: upload a mirror selfie plus the occasion. AI returns a score out of 10, what works, what to change, and which items from his closet to swap in (matched by item id).
7. **History**: list of worn outfits by date, with a thumbs up/down he can set later. Thumbs feed back into scoring.
8. **Settings**: manage occasions, toggle AI on/off, export closet as JSON, import JSON.

## Occasions (editable, seed these)
| id | label | target formality (1-5) | notes |
|---|---|---|---|
| date | Date night | 3.5 | no joggers, no graphic tees |
| family | Her family | 4 | strict: no ripped jeans, no fleece, no joggers |
| friends | Friends | 2.5 | |
| cinema | Cinema | 3 | indoor: avoid puffers unless cold |
| uni | Uni | 2 | |
| chill | Chill / errands | 1.5 | |
| semi_formal | Semi-formal (Katb Ketab, events) | 4.5 | needs shirt; blazer if owned |

## Weather
Chips: Hot, Warm, Mild, Cold.
- Hot/Warm: base layer only (tee or shirt), no jacket. Hot: jacket never.
- Mild: base + a mid layer (sweatshirt or zip hoodie) OR base + light jacket.
- Cold: base + mid + jacket.
Optional later: fetch Cairo weather automatically. Not in v1.

## Data model (Supabase / Postgres)
```
items(
  id uuid pk, name text, brand text null,
  category text check in ('base','mid','jacket','pants','shoes','accessory'),
  subtype text,          -- tee, shirt, sweatshirt, zip_hoodie, hoodie, puffer, bomber, blazer, jeans, trousers, joggers, sneakers, boots, ...
  color text,            -- from the palette list below
  formality int 1-5, warmth int 1-5,
  fit text null,         -- slim, regular, baggy, oversized
  flags text[] default '{}',   -- ripped, graphic, hooded, bulky, logo_big
  photo_path text null, in_wash bool default false,
  notes text null, needs_confirm bool default false,
  created_at timestamptz default now()
)
occasions(id text pk, label text, target_formality numeric, strict bool, indoor bool, notes text)
outfits_worn(
  id uuid pk, item_ids uuid[], occasion_id text, weather text,
  rating int null check in (-1,0,1), worn_on date default current_date
)
fit_checks(id uuid pk, photo_path text, occasion_id text, ai_result jsonb, created_at timestamptz)
```
Color palette (fixed list): white, off_white, cream, beige, light_grey, grey, charcoal, black, navy, royal_blue, bright_blue, light_blue_denim, mid_blue_denim, dark_blue_denim, tan, camel, brown, dark_brown, burgundy, olive, red, other.

Each color has a lightness value (0-100) and a family (neutral, blue, earth, warm) in `lib/engine/colors.ts`.

## Outfit engine (lib/engine)
Pure functions, no AI. Input: items (not in wash), occasion, weather, optional anchor item, recent history. Output: top 3 outfits.
1. Build candidate outfits from the layer rules for the weather.
2. Score each with docs/STYLE_RULES.md. Every rule adds or removes points and emits a short human reason.
3. Apply history: -points if the main top or jacket was worn in the last 3 outfits; +points for item combos rated thumbs up; -points for thumbs down.
4. Pick the top 3 that differ from each other by at least 2 pieces.
5. Return reasons sorted by weight. Max 3 positives and 2 warnings shown.
Unit tests MUST cover: navy-on-black layering is penalised, joggers never win "Her family", a white tee under a zip hoodie scores higher than a navy tee, the 3 results are diverse.

## AI features (lib/ai)
Model id comes from ANTHROPIC_MODEL. Send images as base64. Always ask for JSON only.
1. **tagItem(photo)** returns `{name, category, subtype, color (from palette), brand|null, formality, warmth, fit|null, flags[]}`.
2. **rateFit(photo, occasion, closet summary)** returns `{score 0-10, verdict, works[], change[], swaps:[{item_id, reason}]}`. Include the closet as a compact list (id, name, color, category) so swaps use real items. System prompt includes docs/STYLE_RULES.md.
3. **askStylist(question)** (Phase 5, optional): free chat with the closet and rules as context; answers in 3 to 5 short lines and names real items.

## API routes
POST /api/login · GET/POST /api/items · GET/PATCH/DELETE /api/items/[id] · POST /api/items/upload · POST /api/ai/tag · POST /api/outfits/suggest · POST /api/outfits/wear · PATCH /api/outfits/[id] (rating) · POST /api/ai/rate · GET /api/export · POST /api/import

## Build phases (stop after each)
**Phase 1: Foundation**
- Next.js app, Tailwind, login + middleware, Supabase schema.sql, seed script that loads docs/seed/wardrobe.json and the occasions table.
- Done when: I can log in locally and `npm run seed` fills the DB.

**Phase 2: Closet**
- Closet grid, item detail, add/edit/delete, photo upload to Storage, In wash toggle.
- Done when: I can add an item with a photo from my phone and see it in the grid.

**Phase 3: Outfit engine + Today screen**
- lib/engine with tests, Today screen, "I'm wearing this", History screen with thumbs.
- Done when: `npm test` passes and Today shows 3 diverse picks for every occasion/weather combo that has valid outfits (or a clear empty state).

**Phase 4: AI**
- Auto-tag on Add, Rate my fit screen. Graceful "AI is off" when no key.
- Done when: a clothing photo auto-fills the form, and a selfie returns a score with swaps that link to real closet items.

**Phase 5: Polish + deploy**
- PWA manifest + icons, dark mode check, export/import, optional Ask the stylist.
- Push to GitHub, deploy on Vercel (ask me first), list the env vars I must set.
- Done when: it runs on my iPhone from the home-screen icon.

## Out of scope for v1
Multi-user, shopping links, weather API, calendar sync, social sharing, background removal on photos.
