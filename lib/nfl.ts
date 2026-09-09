/**
 * The 32 NFL teams. `code` is the storage key, `city` is what the pool grid
 * shows (matching the paper sheet), `name` is the full name for dropdowns.
 */
export type Team = { code: string; name: string; city: string };

export const TEAMS: Team[] = [
  { code: 'ARI', name: 'Arizona Cardinals',     city: 'ARIZONA' },
  { code: 'ATL', name: 'Atlanta Falcons',       city: 'ATLANTA' },
  { code: 'BAL', name: 'Baltimore Ravens',      city: 'BALTIMORE' },
  { code: 'BUF', name: 'Buffalo Bills',         city: 'BUFFALO' },
  { code: 'CAR', name: 'Carolina Panthers',     city: 'CAROLINA' },
  { code: 'CHI', name: 'Chicago Bears',         city: 'CHICAGO' },
  { code: 'CIN', name: 'Cincinnati Bengals',    city: 'CINCY' },
  { code: 'CLE', name: 'Cleveland Browns',      city: 'CLEVELAND' },
  { code: 'DAL', name: 'Dallas Cowboys',        city: 'DALLAS' },
  { code: 'DEN', name: 'Denver Broncos',        city: 'DENVER' },
  { code: 'DET', name: 'Detroit Lions',         city: 'DETROIT' },
  { code: 'GB',  name: 'Green Bay Packers',     city: 'GREEN BAY' },
  { code: 'HOU', name: 'Houston Texans',        city: 'HOUSTON' },
  { code: 'IND', name: 'Indianapolis Colts',    city: 'INDY' },
  { code: 'JAX', name: 'Jacksonville Jaguars',  city: 'JAX' },
  { code: 'KC',  name: 'Kansas City Chiefs',    city: 'KC' },
  { code: 'LV',  name: 'Las Vegas Raiders',     city: 'RAIDERS' },
  { code: 'LAC', name: 'Los Angeles Chargers',  city: 'CHARGERS' },
  { code: 'LAR', name: 'Los Angeles Rams',      city: 'RAMS' },
  { code: 'MIA', name: 'Miami Dolphins',        city: 'MIAMI' },
  { code: 'MIN', name: 'Minnesota Vikings',     city: 'MINNESOTA' },
  { code: 'NE',  name: 'New England Patriots',  city: 'NEW ENGLAND' },
  { code: 'NO',  name: 'New Orleans Saints',    city: 'SAINTS' },
  { code: 'NYG', name: 'New York Giants',       city: 'GIANTS' },
  { code: 'NYJ', name: 'New York Jets',         city: 'JETS' },
  { code: 'PHI', name: 'Philadelphia Eagles',   city: 'PHILLY' },
  { code: 'PIT', name: 'Pittsburgh Steelers',   city: 'PITTSBURGH' },
  { code: 'SF',  name: 'San Francisco 49ers',   city: 'SAN FRANCISCO' },
  { code: 'SEA', name: 'Seattle Seahawks',      city: 'SEATTLE' },
  { code: 'TB',  name: 'Tampa Bay Buccaneers',  city: 'TAMPA BAY' },
  { code: 'TEN', name: 'Tennessee Titans',      city: 'TENNESSEE' },
  { code: 'WAS', name: 'Washington Commanders', city: 'WASHINGTON' }
];

export const TEAM_BY_CODE: Record<string, Team> = Object.fromEntries(
  TEAMS.map(t => [t.code, t])
);

export const teamName = (code: string) => TEAM_BY_CODE[code]?.name ?? code;
export const teamCity = (code: string) => TEAM_BY_CODE[code]?.city ?? code;
