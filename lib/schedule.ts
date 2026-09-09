/**
 * Schedule helpers — matchup labels and the weekly deadline.
 *
 * The deadline is noon CT on the day of that week's FIRST game, which is not
 * always Sunday: some weeks open Wednesday or Thursday. It is stored per week
 * in the `weeks` table rather than computed, so the commissioner can correct
 * it without a deploy.
 */
import { teamName } from './nfl';

export type Game = {
  id: number;
  week: number;
  home: string;
  away: string;
  winner: string | null;
  is_tie: boolean;
};

export type Week = {
  week: number;
  deadline: string;
  first_game_label: string | null;
  is_final: boolean;
  byes: string[];
};

/** Find a team's game for the week. */
export function gameFor(games: Game[], team: string): Game | undefined {
  return games.find(g => g.home === team || g.away === team);
}

/**
 * "New England Patriots (at Buffalo Bills)" — so nobody has to look up who
 * they're playing before picking.
 */
export function matchupLabel(games: Game[], team: string): string {
  const g = gameFor(games, team);
  if (!g) return teamName(team);
  const home = g.home === team;
  const opp = home ? g.away : g.home;
  return `${teamName(team)} (${home ? 'vs. ' : 'at '}${teamName(opp)})`;
}

export function isLocked(week: Week | null): boolean {
  if (!week) return false;
  return Date.now() >= Date.parse(week.deadline);
}

const CT = 'America/Chicago';

export function deadlineLabel(week: Week | null): string {
  if (!week) return 'Deadline not set';
  const d = new Date(week.deadline);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: CT });
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: CT });
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: CT
  });
  return `Picks close ${day} ${date} at ${time} CT`;
}

/** Teams playing this week — everyone not on bye. */
export function playingTeams(games: Game[]): string[] {
  return games.flatMap(g => [g.home, g.away]);
}
