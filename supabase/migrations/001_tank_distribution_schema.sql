-- =============================================================================
-- TANK DISTRIBUTION — SUPABASE POSTGRESQL SCHEMA & RLS MIGRATION
-- Version: 2.4.0 | DDEX ERN 4.3 Compatible Catalog, Tracks, Splits & Royalties
-- Run this migration in the Supabase SQL Editor or via `supabase db push`
-- =============================================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ARTIST / LABEL PROFILES & MULTI-ROLE USER ACCOUNTS
-- -----------------------------------------------------------------------------
create table if not exists public.user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  display_role text not null,
  role_category text not null check (role_category in ('tank_admin', 'artiste', 'music_manager', 'label_exec', 'producer_collab')),
  email text not null unique,
  organization text not null default 'Independent Roster',
  location text not null default 'Kampala, UG',
  associated_artists text[] not null default array[]::text[],
  can_see_tech_details boolean not null default false,
  -- Database-level constraint: ONLY tank_admin can ever have can_see_tech_details = true
  constraint admin_only_tech_visibility check (can_see_tech_details = false or role_category = 'tank_admin'),
  created_at timestamptz not null default now()
);

create table if not exists public.artist_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  artist_name text not null,
  legal_name text not null,
  label_name text not null default 'Tank Recordings',
  email text not null,
  github_handle text,
  ipi_number text default '01148920412',
  pro_affiliation text default 'ASCAP / PRS',
  country text default 'UG / Global',
  plan_tier text not null default 'TANK PRO LABEL (100% Royalties)',
  verified boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. RELEASES (Singles, EPs, Albums)
-- -----------------------------------------------------------------------------
create table if not exists public.releases (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete set null,
  title text not null,
  primary_artist text not null,
  featured_artists text default '',
  release_type text not null check (release_type in ('Single', 'EP', 'Album')),
  primary_genre text not null,
  subgenre text default 'Electronic / Alternative',
  label_name text not null default 'Tank Recordings',
  upc_code text not null unique,
  catalog_number text not null,
  release_date date not null,
  original_release_date date,
  p_line text not null,
  c_line text not null,
  cover_art_url text not null,
  status text not null check (status in ('Delivered', 'In Review', 'Processing', 'Draft')) default 'In Review',
  explicit boolean not null default false,
  stores_selected text[] not null default array['Spotify','Apple Music','TikTok','YouTube Music','Beatport','Tidal','Amazon Music','Deezer','Instagram / Meta','Audiomack'],
  stores_delivered integer not null default 0,
  total_streams bigint not null default 0,
  total_royalties numeric(12,2) not null default 0.00,
  ddex_version text not null default 'ERN-4.3',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. MASTER TRACKS (Audio metadata, ISRC, LUFS & DSP readiness)
-- -----------------------------------------------------------------------------
create table if not exists public.tracks (
  id uuid primary key default uuid_generate_v4(),
  release_id uuid not null references public.releases(id) on delete cascade,
  track_number integer not null default 1,
  title text not null,
  version text not null default 'Original Mix',
  primary_artist text not null,
  featured_artists text default '',
  isrc_code text not null unique,
  songwriter_legal_name text not null,
  explicit_lyrics boolean not null default false,
  language text not null default 'English',
  duration_seconds integer not null default 214,
  sample_rate text not null default '24-bit / 48.0 kHz WAV',
  integrated_lufs numeric(4,1) not null default -14.0,
  true_peak_dbtp numeric(4,1) not null default -0.3,
  audio_url text,
  synth_preset text not null default 'cyber-bass',
  streams bigint not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. AUTOMATED ROYALTY SPLITS (Must sum to 100% per release)
-- -----------------------------------------------------------------------------
create table if not exists public.royalty_splits (
  id uuid primary key default uuid_generate_v4(),
  release_id uuid not null references public.releases(id) on delete cascade,
  collaborator_name text not null,
  collaborator_email text not null,
  role text not null,
  share_percentage numeric(5,2) not null check (share_percentage > 0 and share_percentage <= 100),
  status text not null check (status in ('Verified', 'Pending')) default 'Verified',
  payout_method text not null default 'Stripe Connect',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 5. DSP STORE DELIVERIES (Per-store DDEX ingestion & live status)
-- -----------------------------------------------------------------------------
create table if not exists public.dsp_deliveries (
  id uuid primary key default uuid_generate_v4(),
  release_id uuid not null references public.releases(id) on delete cascade,
  store_id text not null,
  store_name text not null,
  delivery_status text not null check (delivery_status in ('Delivered', 'In Review', 'Processing', 'Queued')) default 'Delivered',
  ddex_batch_id text not null,
  streams bigint not null default 0,
  revenue_usd numeric(12,2) not null default 0.00,
  delivered_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 6. ROYALTY LEDGER & PAYOUT REQUESTS
-- -----------------------------------------------------------------------------
create table if not exists public.royalty_transactions (
  id uuid primary key default uuid_generate_v4(),
  release_id uuid references public.releases(id) on delete set null,
  release_title text not null,
  upc_code text not null,
  store_name text not null,
  territory text not null default 'Global',
  reporting_period text not null,
  streams bigint not null default 0,
  gross_revenue numeric(12,2) not null default 0.00,
  net_payout numeric(12,2) not null default 0.00,
  status text not null check (status in ('Cleared', 'Pending Settlement')) default 'Cleared',
  created_at timestamptz not null default now()
);

create table if not exists public.payout_requests (
  id uuid primary key default uuid_generate_v4(),
  amount_usd numeric(12,2) not null check (amount_usd > 0),
  payout_method text not null,
  destination_account text not null,
  reference_code text not null,
  status text not null check (status in ('Completed', 'Processing', 'Scheduled')) default 'Completed',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 7. STORAGE BUCKETS & ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('cover-art', 'cover-art', true),
  ('master-audio', 'master-audio', true)
on conflict (id) do nothing;

alter table public.artist_profiles enable row level security;
alter table public.releases enable row level security;
alter table public.tracks enable row level security;
alter table public.royalty_splits enable row level security;
alter table public.dsp_deliveries enable row level security;
alter table public.royalty_transactions enable row level security;
alter table public.payout_requests enable row level security;

-- Open read/write policies for demo & authenticated studio sessions
create policy "Public read/write access on artist_profiles" on public.artist_profiles for all using (true) with check (true);
create policy "Public read/write access on releases" on public.releases for all using (true) with check (true);
create policy "Public read/write access on tracks" on public.tracks for all using (true) with check (true);
create policy "Public read/write access on royalty_splits" on public.royalty_splits for all using (true) with check (true);
create policy "Public read/write access on dsp_deliveries" on public.dsp_deliveries for all using (true) with check (true);
create policy "Public read/write access on royalty_transactions" on public.royalty_transactions for all using (true) with check (true);
create policy "Public read/write access on payout_requests" on public.payout_requests for all using (true) with check (true);
