# Rodeo Survivor Pool

Self-service NFL survivor pool for 34 players. Next.js 14 (App Router) + Supabase.

## Setup

1. `npm install`
2. Create a Supabase project. In the SQL editor run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Project settings → API)
   - `SESSION_SECRET` — 32+ random chars (`openssl rand -base64 48`)
4. `npm run dev`

## How sign-in works

Players pick their name from the roster and enter a 6-digit PIN. **The first PIN a
player types becomes their PIN** (bcrypt-hashed into `players.pin_hash`) — nobody
has to issue credentials. The session is a signed httpOnly JWT good for 120 days,
so it's one sign-in per device per season.

Need to reset someone's PIN? In Supabase: `update players set pin_hash = null where name = 'Name';`

## Admin

`/admin` is limited to Jason Bottoms and Chad Mezoian, gated twice: the server
action checks `is_commissioner` **and** the name allowlist, and the page refuses
to render for anyone else. Change the list in `app/actions.ts` and `app/admin/page.tsx`.

Admin can: set the current week, mark a week final, enter game winners (picks grade
themselves), backfill any player's pick for any week, and mark entry/buyback payments.

## Results are never typed in per player

`games.winner` drives everything. A trigger calls `grade_week()`, which grades every
pick for that week from the schedule and — once the week is marked final — records a
loss for anyone who never picked.

## Rules logic

All of it lives in `lib/survivor.ts` as pure functions, including the one rule that's
easy to get wrong: a buyback restores **only the team you lost with**. Teams you won
with stay burned forever. The same functions feed the pick dropdown, the grid colors,
status, and the payments list — so nothing can disagree.

## Deploy (rodeosurvivorpool.com)

1. Push to GitHub, import into Vercel.
2. Add the three env vars to the Vercel project (Production + Preview).
3. Add `rodeosurvivorpool.com` under Vercel → Domains and point the registrar's
   nameservers or A/CNAME records as Vercel instructs.
4. Redeploy. `SESSION_SECRET` must stay stable or everyone gets signed out.

## Weekly rhythm

- Monday/Tuesday: enter last week's winners on /admin, mark the week final, bump the current week.
- Deadlines live in `weeks.deadline` (noon CT on that week's first game) and are editable per week.

## Moving to Supabase Auth

The schema keeps a `players.auth_user_id` column for this. Switching to magic links
means: enable email auth, backfill `auth_user_id`, replace `lib/session.ts` with
`@supabase/ssr` cookies, and add RLS policies (the tables are RLS-on with no public
policies today — all access is server-side with the service role key).
