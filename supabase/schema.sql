-- ═══════════════════════════════════════════════════════════════════════════
-- Rodeo Survivor Pool — schema
-- Run this in the Supabase SQL editor (Database → SQL Editor → New query).
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── Settings: one row, id = 1 ──────────────────────────────────────────────
create table if not exists settings (
  id              int primary key default 1 check (id = 1),
  venmo_handle    text        not null default '@Jason-Bottoms-3',
  entry_fee       int         not null default 110,
  buyback_fee     int         not null default 160,
  tie_counts_as   text        not null default 'loss' check (tie_counts_as in ('loss','advance')),
  prize_text      text        not null default 'The last player standing wins the pool. The final prize depends on the number of entries and buybacks.',
  current_week    int         not null default 1,
  total_weeks     int         not null default 18,
  updated_at      timestamptz not null default now()
);

insert into settings (id) values (1) on conflict (id) do nothing;

-- ─── Players ────────────────────────────────────────────────────────────────
create table if not exists players (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null unique,
  email            text,
  pin_hash         text,                       -- null until the player sets a PIN
  is_commissioner  boolean     not null default false,
  entry_paid       boolean     not null default false,
  buyback_paid     boolean     not null default false,
  buyback_status   text        not null default 'available'
                   check (buyback_status in ('available','used','declined')),
  auth_user_id     uuid,                       -- reserved for Supabase Auth (see README)
  created_at       timestamptz not null default now()
);

-- ─── Weeks: deadline is noon CT on the day of that week's first game ────────
create table if not exists weeks (
  week             int         primary key,
  deadline         timestamptz not null,
  first_game_label text,
  is_final         boolean     not null default false,
  byes             text[]      not null default '{}'
);

-- ─── Games: the schedule. Drives matchup labels AND grading. ────────────────
create table if not exists games (
  id        bigserial primary key,
  week      int  not null references weeks(week) on delete cascade,
  home      text not null,
  away      text not null,
  winner    text,                              -- null until played
  is_tie    boolean not null default false,
  kickoff   timestamptz,
  unique (week, home, away)
);

create index if not exists games_week_idx on games(week);

-- ─── Picks: one per player per week ─────────────────────────────────────────
create table if not exists picks (
  id                      bigserial primary key,
  player_id               uuid not null references players(id) on delete cascade,
  week                    int  not null references weeks(week) on delete cascade,
  team                    text not null,
  result                  text not null default 'pending'
                          check (result in ('pending','won','lost')),
  entered_by_commissioner boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (player_id, week)
);

create index if not exists picks_player_idx on picks(player_id);
create index if not exists picks_week_idx   on picks(week);

-- ═══════════════════════════════════════════════════════════════════════════
-- Grading — results are derived from the schedule, never typed in by hand.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function grade_week(w int)
returns void
language plpgsql
security definer
as $$
declare
  tie_rule text;
begin
  select tie_counts_as into tie_rule from settings where id = 1;

  update picks p
  set    result = case
           when g.is_tie then (case when tie_rule = 'advance' then 'won' else 'lost' end)
           when g.winner is null then 'pending'
           when g.winner = p.team then 'won'
           else 'lost'
         end,
         updated_at = now()
  from   games g
  where  p.week = w
    and  g.week = w
    and  (g.home = p.team or g.away = p.team);

  -- A player who never picked and whose deadline has passed takes a loss.
  insert into picks (player_id, week, team, result, entered_by_commissioner)
  select pl.id, w, 'NONE', 'lost', true
  from   players pl
  where  not exists (select 1 from picks x where x.player_id = pl.id and x.week = w)
    and  (select deadline from weeks where week = w) < now()
    and  (select is_final from weeks where week = w) = true
  on conflict (player_id, week) do nothing;
end;
$$;

-- Re-grade automatically whenever a game result lands.
create or replace function games_after_change() returns trigger
language plpgsql as $$
begin
  perform grade_week(new.week);
  return new;
end;
$$;

drop trigger if exists games_grade_trigger on games;
create trigger games_grade_trigger
  after insert or update of winner, is_tie on games
  for each row execute function games_after_change();

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
--
-- This app talks to the database ONLY from server actions using the service
-- role key, which bypasses RLS. So we enable RLS with no public policies:
-- the anon/authenticated keys can read and write nothing. That is deliberate.
-- If you later move to Supabase Auth and client-side queries, add policies
-- here (see README → "Moving to Supabase Auth").
-- ═══════════════════════════════════════════════════════════════════════════
alter table settings enable row level security;
alter table players  enable row level security;
alter table weeks    enable row level security;
alter table games    enable row level security;
alter table picks    enable row level security;
