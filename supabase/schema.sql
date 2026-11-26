-- Closet schema. Paste this whole file into Supabase > SQL Editor and run it once.
-- Safe to re-run: everything uses "if not exists" / "on conflict do nothing".
-- Data is loaded afterwards with `npm run seed` (items from docs/seed/wardrobe.json + occasions).

-- ---------- items ----------
create table if not exists public.items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  brand         text,
  category      text not null check (category in ('base','mid','jacket','pants','shoes','accessory')),
  subtype       text not null,
  color         text not null check (color in (
                  'white','off_white','cream','beige','light_grey','grey','charcoal','black',
                  'navy','royal_blue','bright_blue','light_blue_denim','mid_blue_denim','dark_blue_denim',
                  'tan','camel','brown','dark_brown','burgundy','olive','red','other')),
  formality     int  not null check (formality between 1 and 5),
  warmth        int  not null check (warmth between 1 and 5),
  fit           text check (fit in ('slim','regular','baggy','oversized')),
  flags         text[] not null default '{}',
  photo_path    text,
  in_wash       boolean not null default false,
  notes         text,
  needs_confirm boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists items_category_idx on public.items (category);

-- ---------- occasions ----------
create table if not exists public.occasions (
  id               text primary key,
  label            text not null,
  target_formality numeric(2,1) not null check (target_formality between 1 and 5),
  strict           boolean not null default false,
  indoor           boolean not null default false,
  notes            text,
  sort_order       int not null default 0   -- order of the chips on the Today screen
);

-- ---------- outfits_worn ----------
create table if not exists public.outfits_worn (
  id          uuid primary key default gen_random_uuid(),
  item_ids    uuid[] not null,
  occasion_id text references public.occasions (id) on delete set null,
  weather     text check (weather in ('hot','warm','mild','cold')),
  rating      int check (rating in (-1, 0, 1)),
  worn_on     date not null default current_date,
  created_at  timestamptz not null default now()  -- orders several outfits on the same day
);

create index if not exists outfits_worn_worn_on_idx on public.outfits_worn (worn_on desc, created_at desc);
create index if not exists outfits_worn_item_ids_idx on public.outfits_worn using gin (item_ids);

-- ---------- fit_checks ----------
create table if not exists public.fit_checks (
  id          uuid primary key default gen_random_uuid(),
  photo_path  text not null,
  occasion_id text references public.occasions (id) on delete set null,
  ai_result   jsonb not null,
  created_at  timestamptz not null default now()
);

-- ---------- lock everything down ----------
-- RLS on with no policies = the public anon key can read/write nothing.
-- The app only talks to Supabase from the server with the service role key, which bypasses RLS.
alter table public.items        enable row level security;
alter table public.occasions    enable row level security;
alter table public.outfits_worn enable row level security;
alter table public.fit_checks   enable row level security;

-- ---------- storage ----------
-- Private bucket for clothing photos and mirror selfies (max 5 MB, images only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clothes', 'clothes', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
