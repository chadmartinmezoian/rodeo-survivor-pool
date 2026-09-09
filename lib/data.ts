import { supabaseAdmin } from './supabase/server';
import type { Game, Week } from './schedule';
import type { Pick, PlayerLike, BuybackStatus } from './survivor';

/** Everything a page needs about the pool, in one round trip. */
export type Player = PlayerLike & {
  email: string | null;
  is_commissioner: boolean;
  entry_paid: boolean;
  buyback_paid: boolean;
  buyback_status: BuybackStatus;
  has_pin: boolean;
};

export type Settings = {
  venmo_handle: string;
  entry_fee: number;
  buyback_fee: number;
  tie_counts_as: 'loss' | 'advance';
  prize_text: string;
  current_week: number;
  total_weeks: number;
};

export type PoolData = {
  settings: Settings;
  players: Player[];
  week: Week | null;
  games: Game[];
  weeks: Week[];
};

export async function getSettings(): Promise<Settings> {
  const db = supabaseAdmin();
  const { data, error } = await db.from('settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data as Settings;
}

export async function getPool(): Promise<PoolData> {
  const db = supabaseAdmin();

  const [settingsRes, playersRes, picksRes, weeksRes] = await Promise.all([
    db.from('settings').select('*').eq('id', 1).single(),
    db.from('players').select('*').order('name'),
    db.from('picks').select('*'),
    db.from('weeks').select('*').order('week')
  ]);

  if (settingsRes.error) throw settingsRes.error;
  if (playersRes.error) throw playersRes.error;
  if (picksRes.error) throw picksRes.error;
  if (weeksRes.error) throw weeksRes.error;

  const settings = settingsRes.data as Settings;
  const allPicks = (picksRes.data ?? []) as (Pick & { player_id: string })[];
  const weeks = (weeksRes.data ?? []) as Week[];
  const week = weeks.find(w => w.week === settings.current_week) ?? null;

  const gamesRes = await db.from('games').select('*').eq('week', settings.current_week);
  if (gamesRes.error) throw gamesRes.error;

  const players: Player[] = (playersRes.data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    is_commissioner: row.is_commissioner,
    entry_paid: row.entry_paid,
    buyback_paid: row.buyback_paid,
    buyback_status: row.buyback_status,
    has_pin: Boolean(row.pin_hash),
    picks: allPicks
      .filter(p => p.player_id === row.id)
      .map(p => ({
        week: p.week,
        team: p.team,
        result: p.result,
        entered_by_commissioner: p.entered_by_commissioner
      }))
      .sort((a, b) => a.week - b.week)
  }));

  return { settings, players, week, games: (gamesRes.data ?? []) as Game[], weeks };
}

/** The roster for the sign-in screen — names only, no PIN hashes. */
export async function getRoster(): Promise<{ id: string; name: string; has_pin: boolean }[]> {
  const db = supabaseAdmin();
  const { data, error } = await db.from('players').select('id, name, pin_hash').order('name');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ id: r.id, name: r.name, has_pin: Boolean(r.pin_hash) }));
}

export async function getPlayer(id: string): Promise<Player | null> {
  const { players } = await getPool();
  return players.find(p => p.id === id) ?? null;
}

export async function getWeekGames(week: number): Promise<Game[]> {
  const db = supabaseAdmin();
  const { data, error } = await db.from('games').select('*').eq('week', week);
  if (error) throw error;
  return (data ?? []) as Game[];
}

export async function getWeek(week: number): Promise<Week | null> {
  const db = supabaseAdmin();
  const { data, error } = await db.from('weeks').select('*').eq('week', week).maybeSingle();
  if (error) throw error;
  return (data as Week) ?? null;
}
