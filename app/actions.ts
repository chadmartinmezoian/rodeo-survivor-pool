'use server';
/**
 * Every write goes through here. Server actions run with the service-role key,
 * so the rules are enforced on the server — a crafted request can't cheat.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/server';
import { teamName } from '@/lib/nfl';
import { createSession, clearSession, getSession } from '@/lib/session';
import { getPool, getSettings, getWeek, getWeekGames } from '@/lib/data';
import { isLocked } from '@/lib/schedule';
import { validatePick, statusOf } from '@/lib/survivor';

const COMMISSIONERS = ['Jason Bottoms', 'Chad Mezoian'];

function fail(msg: string): never {
  throw new Error(msg);
}

async function requireSession() {
  const s = await getSession();
  if (!s) redirect('/login');
  return s;
}

/** Admin is gated twice: here on the server, and in the page's own render. */
async function requireCommissioner() {
  const s = await requireSession();
  const db = supabaseAdmin();
  const { data } = await db.from('players').select('name, is_commissioner').eq('id', s.playerId).single();
  if (!data?.is_commissioner || !COMMISSIONERS.includes(data.name)) fail('Commissioners only.');
  return s;
}

/* ─── auth ───────────────────────────────────────────────────────────────── */

export async function signIn(_prev: unknown, form: FormData) {
  const playerId = String(form.get('playerId') ?? '');
  const pin = String(form.get('pin') ?? '').trim();
  if (!/^\d{6}$/.test(pin)) return { error: 'Your PIN is 6 digits.' };

  const db = supabaseAdmin();
  const { data: player } = await db
    .from('players')
    .select('id, name, pin_hash, is_commissioner')
    .eq('id', playerId)
    .single();
  if (!player) return { error: 'Pick your name from the list.' };

  if (!player.pin_hash) {
    // First sign-in sets the PIN. Nobody has to be issued one.
    const hash = await bcrypt.hash(pin, 10);
    const { error } = await db.from('players').update({ pin_hash: hash }).eq('id', player.id);
    if (error) return { error: 'Could not save that PIN. Try again.' };
  } else if (!(await bcrypt.compare(pin, player.pin_hash))) {
    return { error: 'That PIN does not match. Try again.' };
  }

  await createSession({
    playerId: player.id,
    name: player.name,
    isCommissioner: Boolean(player.is_commissioner) && COMMISSIONERS.includes(player.name)
  });
  redirect('/');
}

export async function signOut() {
  clearSession();
  redirect('/login');
}

/* ─── picks ──────────────────────────────────────────────────────────────── */

export async function submitPick(_prev: unknown, form: FormData) {
  const s = await requireSession();
  const team = String(form.get('team') ?? '');
  const settings = await getSettings();
  const week = await getWeek(settings.current_week);

  if (isLocked(week)) return { error: 'Picks are closed for this week.' };

  const { players } = await getPool();
  const me = players.find(p => p.id === s.playerId);
  if (!me) return { error: 'Player not found.' };

  const check = validatePick(me, team, week?.byes ?? []);
  if (!check.ok) return { error: check.reason };

  const db = supabaseAdmin();
  const { error } = await db
    .from('picks')
    .upsert(
      { player_id: s.playerId, week: settings.current_week, team, result: 'pending', updated_at: new Date().toISOString() },
      { onConflict: 'player_id,week' }
    );
  if (error) return { error: 'Could not save your pick. Try again.' };

  revalidatePath('/');
  revalidatePath('/standings');
  revalidatePath('/my-picks');
  return { ok: true, team };
}

/* ─── buyback: the player takes it themselves ────────────────────────────── */

export async function takeBuyback() {
  const s = await requireSession();
  const { players } = await getPool();
  const me = players.find(p => p.id === s.playerId);
  if (!me || statusOf(me) !== 'buyback') fail('No buyback available.');

  const db = supabaseAdmin();
  await db.from('players').update({ buyback_status: 'used', buyback_paid: false }).eq('id', s.playerId);
  revalidatePath('/');
  revalidatePath('/standings');
  revalidatePath('/admin');
}

export async function declineBuyback() {
  const s = await requireSession();
  const db = supabaseAdmin();
  await db.from('players').update({ buyback_status: 'declined' }).eq('id', s.playerId);
  revalidatePath('/');
  revalidatePath('/standings');
}

/* ─── commissioner ───────────────────────────────────────────────────────── */

export async function setCurrentWeek(form: FormData) {
  await requireCommissioner();
  const week = Number(form.get('week'));
  await supabaseAdmin().from('settings').update({ current_week: week }).eq('id', 1);
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function togglePaid(form: FormData) {
  await requireCommissioner();
  const id = String(form.get('playerId'));
  const field = String(form.get('field'));
  if (field !== 'entry_paid' && field !== 'buyback_paid') fail('Unknown field.');
  const value = String(form.get('value')) === 'true';
  await supabaseAdmin().from('players').update({ [field]: value }).eq('id', id);
  revalidatePath('/admin');
}

/** Backfill or correct any player's pick for any week. */
export async function adminSetPick(form: FormData) {
  await requireCommissioner();
  const player_id = String(form.get('playerId'));
  const week = Number(form.get('week'));
  const team = String(form.get('team'));
  const db = supabaseAdmin();

  if (!team) {
    await db.from('picks').delete().eq('player_id', player_id).eq('week', week);
  } else {
    await db.from('picks').upsert(
      { player_id, week, team, result: 'pending', entered_by_commissioner: true, updated_at: new Date().toISOString() },
      { onConflict: 'player_id,week' }
    );
    await db.rpc('grade_week', { w: week });
  }
  revalidatePath('/admin');
  revalidatePath('/standings');

  // Send a receipt back to the page — without it the form looks like it did
  // nothing and you click Save three more times.
  const { data: who } = await db.from('players').select('name').eq('id', player_id).single();
  const label = team
    ? `${who?.name ?? 'Pick'} — ${teamName(team)}, week ${week}`
    : `${who?.name ?? 'Pick'} — week ${week} pick cleared`;
  // #backfill keeps the browser parked on the form instead of the page top.
  redirect('/admin?saved=' + encodeURIComponent(label) + '#backfill');
}

/** Results come from the schedule: set a game's winner and grading follows. */
export async function setGameWinner(form: FormData) {
  await requireCommissioner();
  const id = Number(form.get('gameId'));
  const winner = String(form.get('winner') ?? '');
  const db = supabaseAdmin();
  await db
    .from('games')
    .update({ winner: winner === 'TIE' ? null : winner || null, is_tie: winner === 'TIE' })
    .eq('id', id);
  revalidatePath('/admin');
  revalidatePath('/standings');
}

export async function setWeekFinal(form: FormData) {
  await requireCommissioner();
  const week = Number(form.get('week'));
  const isFinal = String(form.get('isFinal')) === 'true';
  const db = supabaseAdmin();
  await db.from('weeks').update({ is_final: isFinal }).eq('week', week);
  if (isFinal) await db.rpc('grade_week', { w: week });
  revalidatePath('/admin');
  revalidatePath('/standings');
}

export async function setDeadline(form: FormData) {
  await requireCommissioner();
  const week = Number(form.get('week'));
  const deadline = String(form.get('deadline'));
  await supabaseAdmin().from('weeks').update({ deadline }).eq('week', week);
  revalidatePath('/admin');
}

/* ─── roster: the commissioner manages names, no SQL required ────────────── */

export async function addPlayer(form: FormData) {
  await requireCommissioner();
  const name = String(form.get('name') ?? '').trim();
  if (name.length < 2) fail('Enter a name.');
  const { error } = await supabaseAdmin().from('players').insert({ name });
  if (error) fail('That name is already on the roster.');
  revalidatePath('/admin');
  revalidatePath('/login');
  revalidatePath('/standings');
}

export async function renamePlayer(form: FormData) {
  await requireCommissioner();
  const id = String(form.get('playerId'));
  const name = String(form.get('name') ?? '').trim();
  if (name.length < 2) fail('Enter a name.');
  const { error } = await supabaseAdmin().from('players').update({ name }).eq('id', id);
  if (error) fail('Another player already has that name.');
  revalidatePath('/admin');
  revalidatePath('/login');
  revalidatePath('/standings');
}

/** Removes the player and their picks. Only for someone who never played. */
export async function removePlayer(form: FormData) {
  await requireCommissioner();
  const id = String(form.get('playerId'));
  const me = await getSession();
  if (me?.playerId === id) fail("You can't remove yourself.");
  await supabaseAdmin().from('players').delete().eq('id', id);
  revalidatePath('/admin');
  revalidatePath('/login');
  revalidatePath('/standings');
}

/** Clears a forgotten PIN — the next PIN they type becomes the new one. */
export async function resetPin(form: FormData) {
  await requireCommissioner();
  const id = String(form.get('playerId'));
  await supabaseAdmin().from('players').update({ pin_hash: null }).eq('id', id);
  revalidatePath('/admin');
}
