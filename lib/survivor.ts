/**
 * ═════════════════════════════════════════════════════════════════════════
 * Survivor logic — the heart of the pool. Pure functions, no I/O, so this
 * file is the single source of truth and is trivially testable.
 *
 * THE RULES
 *  1. A player may use each NFL team only once while alive.
 *  2. Winning with a team burns it permanently.
 *  3. Losing costs a life. Each player has one buyback.
 *  4. Activating the buyback returns ONLY the team they lost with.
 *     Every team they previously won with stays unavailable.
 *  5. A second loss is permanent elimination.
 * ═════════════════════════════════════════════════════════════════════════
 */
import { TEAMS, type Team } from './nfl';

export type PickResult = 'pending' | 'won' | 'lost';
export type BuybackStatus = 'available' | 'used' | 'declined';
export type PlayerStatus = 'alive' | 'buyback' | 'second' | 'eliminated';

export type Pick = {
  week: number;
  team: string;
  result: PickResult;
  entered_by_commissioner?: boolean;
};

export type PlayerLike = {
  id: string;
  name: string;
  buyback_status: BuybackStatus;
  picks: Pick[];
};

/** Picks sorted by week — never trust incoming order. */
const byWeek = (picks: Pick[]) => [...picks].sort((a, b) => a.week - b.week);

export function losses(picks: Pick[]): number {
  return picks.filter(p => p.result === 'lost').length;
}

/**
 * Status is DERIVED, never stored. That way it can't disagree with the picks:
 * change a result and the status, standings and counts all follow.
 */
export function statusOf(player: PlayerLike): PlayerStatus {
  const l = losses(player.picks);
  if (l >= 2) return 'eliminated';
  if (l === 1) {
    if (player.buyback_status === 'used') return 'second';
    if (player.buyback_status === 'declined') return 'eliminated';
    return 'buyback';
  }
  return 'alive';
}

/**
 * The team a buyback gives back: the FIRST team they lost with, and only once
 * the buyback is actually activated.
 */
export function restoredTeam(player: PlayerLike): string | null {
  if (player.buyback_status !== 'used') return null;
  const firstLoss = byWeek(player.picks).find(p => p.result === 'lost');
  return firstLoss ? firstLoss.team : null;
}

/**
 * Teams this player can never use again.
 *
 * Every win burns its team forever. A loss also burns its team — UNLESS the
 * buyback restored it. Rule 4 lives here, and nowhere else.
 */
export function burnedTeams(player: PlayerLike): string[] {
  const restored = restoredTeam(player);
  const burned = new Set<string>();

  for (const pick of player.picks) {
    if (pick.result === 'won') {
      burned.add(pick.team);              // a win always burns the team
    } else if (pick.result === 'lost' && pick.team !== restored) {
      burned.add(pick.team);              // a loss burns it unless restored
    }
  }
  return [...burned].sort();
}

/** Roster-eligible teams: all 32 minus the burned ones. Ignores the schedule. */
export function eligibleTeams(player: PlayerLike): Team[] {
  const burned = new Set(burnedTeams(player));
  return TEAMS.filter(t => !burned.has(t.code));
}

/**
 * What the player can actually pick this week: eligible AND playing.
 * Teams on bye are dropped, so the dropdown never offers an impossible pick.
 */
export function playableTeams(player: PlayerLike, byes: string[]): Team[] {
  const onBye = new Set(byes);
  return eligibleTeams(player).filter(t => !onBye.has(t.code));
}

/** True when this player may still submit picks at all. */
export function canPick(player: PlayerLike): boolean {
  const s = statusOf(player);
  return s === 'alive' || s === 'second';
}

/** Weeks survived — wins only; pending picks don't count yet. */
export function weeksSurvived(player: PlayerLike): number {
  return player.picks.filter(p => p.result === 'won').length;
}

export function firstLoss(player: PlayerLike): Pick | undefined {
  return byWeek(player.picks).find(p => p.result === 'lost');
}

export function lastLoss(player: PlayerLike): Pick | undefined {
  return byWeek(player.picks).filter(p => p.result === 'lost').pop();
}

/**
 * Server-side guard: is this pick legal for this player, this week?
 * Called before every write so a crafted request can't cheat the rules.
 */
export function validatePick(
  player: PlayerLike,
  team: string,
  byes: string[]
): { ok: true } | { ok: false; reason: string } {
  if (!canPick(player)) {
    return { ok: false, reason: 'Your season is over — no more picks.' };
  }
  if (!TEAMS.some(t => t.code === team)) {
    return { ok: false, reason: 'That is not an NFL team.' };
  }
  if (burnedTeams(player).includes(team)) {
    return { ok: false, reason: 'You have already used that team.' };
  }
  if (byes.includes(team)) {
    return { ok: false, reason: 'That team is on bye this week.' };
  }
  return { ok: true };
}

export const STATUS_META: Record<PlayerStatus, { label: string; cls: string }> = {
  alive:      { label: 'Alive',             cls: 'tag-alive' },
  buyback:    { label: 'Buyback Available', cls: 'tag-accent' },
  second:     { label: 'Second Life',       cls: 'tag-accent' },
  eliminated: { label: 'Eliminated',        cls: 'tag-neutral' }
};

/** Sort order for the pool grid: alive first, out last. */
const STATUS_ORDER: Record<PlayerStatus, number> = {
  alive: 0, buyback: 1, second: 2, eliminated: 3
};

export function sortForGrid(players: PlayerLike[]): PlayerLike[] {
  return [...players].sort((a, b) => {
    const d = STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)];
    return d !== 0 ? d : weeksSurvived(b) - weeksSurvived(a);
  });
}

export function groupByStatus(players: PlayerLike[]) {
  const of = (s: PlayerStatus) => players.filter(p => statusOf(p) === s);
  return {
    alive: [...of('alive'), ...of('buyback')],
    second: of('second'),
    eliminated: of('eliminated')
  };
}

/** What a player still owes, in dollars. */
export function amountOwed(
  p: { entry_paid: boolean; buyback_paid: boolean; buyback_status: BuybackStatus },
  entryFee: number,
  buybackFee: number
): number {
  let owed = 0;
  if (!p.entry_paid) owed += entryFee;
  if (p.buyback_status === 'used' && !p.buyback_paid) owed += buybackFee;
  return owed;
}
