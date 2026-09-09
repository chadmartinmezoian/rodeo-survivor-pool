import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getPool, getWeekGames } from '@/lib/data';
import { matchupLabel } from '@/lib/schedule';
import { statusOf, burnedTeams, eligibleTeams, weeksSurvived, STATUS_META } from '@/lib/survivor';
import { teamName } from '@/lib/nfl';

export default async function MyPicksPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { players, settings } = await getPool();
  const me = players.find(p => p.id === session.playerId);
  if (!me) redirect('/login');

  const status = statusOf(me);
  const gamesByWeek = await Promise.all(me.picks.map(p => getWeekGames(p.week)));

  return (
    <div style={{ paddingTop: 26 }}>
      <p className="kicker" style={{ color: 'var(--color-accent-300)', margin: 0 }}>{me.name}</p>
      <h1 style={{ margin: '4px 0 10px' }}>My Picks</h1>
      <div className="row wrap" style={{ gap: 10, marginBottom: 22 }}>
        <span className={'tag ' + STATUS_META[status].cls}>{STATUS_META[status].label}</span>
        <span className="text-muted" style={{ fontSize: 13 }}>
          {weeksSurvived(me)} survived · {eligibleTeams(me).length} teams left
        </span>
      </div>

      <div className="card elev-md" style={{ padding: 6 }}>
        <table className="table">
          <thead>
            <tr><th>Week</th><th>Pick</th><th>Matchup</th><th>Result</th></tr>
          </thead>
          <tbody>
            {me.picks.length === 0 && (
              <tr><td colSpan={4} className="text-muted">No picks yet — Week {settings.current_week} is open.</td></tr>
            )}
            {me.picks.map((p, i) => (
              <tr key={p.week}>
                <td>{p.week}</td>
                <td><strong>{teamName(p.team)}</strong></td>
                <td className="text-muted">{matchupLabel(gamesByWeek[i], p.team)}</td>
                <td>
                  <span className={'tag ' + (p.result === 'won' ? 'tag-alive' : p.result === 'lost' ? 'tag-accent' : 'tag-outline')}>
                    {p.result === 'won' ? 'Won' : p.result === 'lost' ? 'Lost' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 22, marginTop: 30 }}>Teams you've burned</h2>
      <div className="row wrap" style={{ gap: 6 }}>
        {burnedTeams(me).length === 0
          ? <p className="text-muted" style={{ fontSize: 14 }}>None yet.</p>
          : burnedTeams(me).map(t => <span key={t} className="tag tag-neutral">{teamName(t)}</span>)}
      </div>
    </div>
  );
}
