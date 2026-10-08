-- ProxiCore POINT shared cloud schema.
-- Run in Supabase Dashboard → SQL Editor → Run.
-- Creates point_operators, point_sessions, point_observations + open prototype policies.

create table if not exists point_operators (
  id text primary key,
  name text not null,
  role text not null default 'operator',
  last_seen timestamptz not null default now()
);

create table if not exists point_sessions (
  id text primary key,
  operator_id text references point_operators(id),
  operator_name text,
  device_label text,
  updated_at timestamptz not null default now()
);

create table if not exists point_observations (
  id text primary key,
  session_id text not null references point_sessions(id) on delete cascade,
  identity_key text not null,
  label text,
  rotating boolean not null default false,
  count int not null default 1,
  first_seen timestamptz,
  last_seen timestamptz,
  rssi_avg numeric,
  dist_last numeric,
  dist_min numeric,
  bearing numeric,          -- source-reported only, never derived
  lat numeric,              -- scanner position, not target GPS
  lon numeric,
  names text,
  updated_at timestamptz not null default now()
);

create index if not exists point_observations_session_idx on point_observations(session_id);
create index if not exists point_observations_last_seen_idx on point_observations(last_seen desc);

-- Open prototype policies (all users share one backend; tighten for production).
alter table point_operators enable row level security;
alter table point_sessions enable row level security;
alter table point_observations enable row level security;

drop policy if exists point_open_operators on point_operators;
create policy point_open_operators on point_operators for all using (true) with check (true);

drop policy if exists point_open_sessions on point_sessions;
create policy point_open_sessions on point_sessions for all using (true) with check (true);

drop policy if exists point_open_observations on point_observations;
create policy point_open_observations on point_observations for all using (true) with check (true);

-- Realtime for live admin refresh.
alter publication supabase_realtime add table point_sessions;
alter publication supabase_realtime add table point_observations;
