-- ═══════════════════════════════════════════════════════════════════════════
-- Seed — roster, weeks and a couple of sample games.
-- Run AFTER schema.sql. Safe to re-run.
--
-- Replace the roster with your real players. Everyone starts with no PIN:
-- the first time a player picks their name they set their own 6-digit PIN.
-- ═══════════════════════════════════════════════════════════════════════════

insert into players (name, is_commissioner) values
  ('Jason Bottoms',  true),
  ('Chad Mezoian',   true),
  ('Len Sigle',      false),
  ('Steve Petty',    false),
  ('Barry Bancroft', false),
  ('Jake Callahan',  false),
  ('Jeff Callahan',  false),
  ('Keith Melton',   false),
  ('KC Jones',       false),
  ('Buddy Borden',   false),
  ('Jeff Botkin',    false),
  ('Jarod Bottoms',  false),
  ('Jake Griggs',    false),
  ('Augustus Payne', false),
  ('Brennan Moore',  false),
  ('Judd Murray',    false),
  ('Joe Page',       false),
  ('Pat May',        false),
  ('Bryan Smith',    false),
  ('Tony McKendree', false),
  ('Dave Clemmons',  false),
  ('JR Compean',     false),
  ('Josh Turner',    false),
  ('Dan Shanklin',   false),
  ('Stephen Hoover', false),
  ('Ricky Atkeisson',false),
  ('Toby Payne',     false),
  ('Hunter Melton',  false),
  ('James Moore',    false),
  ('Miguel Luna',    false),
  ('Mason Dubois',   false),
  ('Dave Matthews',  false),
  ('Deidrea Payne',  false),
  ('Kolt Bottoms',   false)
on conflict (name) do nothing;

-- ─── Weeks ──────────────────────────────────────────────────────────────────
-- deadline = 12:00 PM CT on the day of that week's FIRST game. Some weeks
-- open on Wednesday or Thursday, so this is per-week rather than "every Sunday".
insert into weeks (week, deadline, first_game_label, is_final, byes) values
  (1, '2026-09-10 12:00:00-05', 'Thu 7:20 PM CT', false, '{}'),
  (2, '2026-09-17 12:00:00-05', 'Thu 7:15 PM CT', false, '{}'),
  (3, '2026-09-24 12:00:00-05', 'Thu 7:15 PM CT', false, '{}'),
  (4, '2026-10-01 12:00:00-05', 'Thu 7:15 PM CT', false, '{}'),
  (5, '2026-10-07 12:00:00-05', 'Wed 7:15 PM CT', false, '{ATL,CHI,GB,PIT}')
on conflict (week) do update
  set deadline = excluded.deadline,
      first_game_label = excluded.first_game_label,
      byes = excluded.byes;

update settings set current_week = 1 where id = 1;

-- ─── Games ──────────────────────────────────────────────────────────────────
-- Add each week's matchups. Set winner (or is_tie) once the game is played and
-- the grade_week trigger updates every pick automatically.
insert into games (week, home, away) values
  (5,'BUF','NE'), (5,'BAL','CLE'), (5,'CIN','MIA'), (5,'KC','LV'),
  (5,'LAC','DEN'), (5,'IND','JAX'), (5,'HOU','TEN'), (5,'DAL','NYG'),
  (5,'PHI','WAS'), (5,'DET','MIN'), (5,'TB','NO'),   (5,'CAR','NYJ'),
  (5,'SF','SEA'),  (5,'LAR','ARI')
on conflict (week, home, away) do nothing;
