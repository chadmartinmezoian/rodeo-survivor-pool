/**
 * The 32 NFL teams. `code` is the storage key, `city` is what the pool grid
 * shows — the mascot, the way the group says it — and `name` is the full name.
 */
export type Team = { code: string; name: string; city: string };

export const TEAMS: Team[] = [
  { code: 'ARI', name: 'Arizona Cardinals',     city: 'CARDINALS' },
  { code: 'ATL', name: 'Atlanta Falcons',       city: 'FALCONS' },
  { code: 'BAL', name: 'Baltimore Ravens',      city: 'RAVENS' },
  { code: 'BUF', name: 'Buffalo Bills',         city: 'BILLS' },
  { code: 'CAR', name: 'Carolina Panthers',     city: 'PANTHERS' },
  { code: 'CHI', name: 'Chicago Bears',         city: 'BEARS' },
  { code: 'CIN', name: 'Cincinnati Bengals',    city: 'BENGALS' },
  { code: 'CLE', name: 'Cleveland Browns',      city: 'BROWNS' },
  { code: 'DAL', name: 'Dallas Cowboys',        city: 'COWBOYS' },
  { code: 'DEN', name: 'Denver Broncos',        city: 'BRONCOS' },
  { code: 'DET', name: 'Detroit Lions',         city: 'LIONS' },
  { code: 'GB',  name: 'Green Bay Packers',     city: 'PACKERS' },
  { code: 'HOU', name: 'Houston Texans',        city: 'TEXANS' },
  { code: 'IND', name: 'Indianapolis Colts',    city: 'COLTS' },
  { code: 'JAX', name: 'Jacksonville Jaguars',  city: 'JAGUARS' },
  { code: 'KC',  name: 'Kansas City Chiefs',    city: 'CHIEFS' },
  { code: 'LV',  name: 'Las Vegas Raiders',     city: 'RAIDERS' },
  { code: 'LAC', name: 'Los Angeles Chargers',  city: 'CHARGERS' },
  { code: 'LAR', name: 'Los Angeles Rams',      city: 'RAMS' },
  { code: 'MIA', name: 'Miami Dolphins',        city: 'DOLPHINS' },
  { code: 'MIN', name: 'Minnesota Vikings',     city: 'VIKINGS' },
  { code: 'NE',  name: 'New England Patriots',  city: 'PATRIOTS' },
  { code: 'NO',  name: 'New Orleans Saints',    city: 'SAINTS' },
  { code: 'NYG', name: 'New York Giants',       city: 'GIANTS' },
  { code: 'NYJ', name: 'New York Jets',         city: 'JETS' },
  { code: 'PHI', name: 'Philadelphia Eagles',   city: 'EAGLES' },
  { code: 'PIT', name: 'Pittsburgh Steelers',   city: 'STEELERS' },
  { code: 'SF',  name: 'San Francisco 49ers',   city: '49ERS' },
  { code: 'SEA', name: 'Seattle Seahawks',      city: 'SEAHAWKS' },
  { code: 'TB',  name: 'Tampa Bay Buccaneers',  city: 'BUCS' },
  { code: 'TEN', name: 'Tennessee Titans',      city: 'TITANS' },
  { code: 'WAS', name: 'Washington Commanders', city: 'COMMANDERS' }
];

export const TEAM_BY_CODE: Record<string, Team> = Object.fromEntries(
  TEAMS.map(t => [t.code, t])
);

export const teamName = (code: string) => TEAM_BY_CODE[code]?.name ?? code;
export const teamCity = (code: string) => TEAM_BY_CODE[code]?.city ?? code;
