import { getPool } from '@/lib/data';
import { statusOf, sortForGrid, groupByStatus, weeksSurvived, STATUS_META } from '@/lib/survivor';
import { TEAMS } from '@/lib/nfl';

const cityOf = (code: string) => TEAMS.find(t => t.code === code)?.city ?? code;

export default async function StandingsPage() {
  const { settings, players } = await getPool();
  const weeks = Array.from({ length: settings.current_week }, (_, i) => i + 1);
  const rows = sortForGrid(players);
  const g = groupByStatus(players);

  return (
    <div style={{ paddingTop: 26 }}>
      <p className="kicker" style={{ color: 'var(--color-accent-300)', margin: 0 }}>The sheet</p>
      <h1 style={{ margin: '4px 0 18px' }}>Standings</h1>

      <div className="grid-cards cols-4" style={{ marginBottom: 24 }}>
        {[
          ['Still alive', g.alive.length],
          ['Second life', g.second.length],
          ['Eliminated', g.eliminated.length],
          ['Week', settings.current_week]
        ].map(([label, n]) => (
          <div key={String(label)} className="card elev-sm">
            <div className="bignum">{n}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="scrollx card elev-md" style={{ padding: 12 }}>
        <table className="grid-t">
          <thead>
            <tr>
              <th className="n">Player</th>
              {weeks.map(w => <th key={w}>{w}</th>)}
              <th>W</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => {
              const status = statusOf(p);
              const out = status === 'eliminated';
              return (
                <tr key={p.id} className={out ? 'out' : ''}>
                  <td className="n">
                    {p.name}
                    {status === 'second' && <span className="tag tag-accent" style={{ marginLeft: 6 }}>2nd</span>}
                  </td>
                  {weeks.map(w => {
                    const pick = p.picks.find(x => x.week === w);
                    if (!pick) return <td key={w} className="c-none" />;
                    const cls = pick.result === 'won' ? 'c-win' : pick.result === 'lost' ? 'c-loss' : 'c-pend';
                    return (
                      <td key={w} className={cls}>
                        <span className="cityname">{cityOf(pick.team)}</span>
                        <span className="codename">{pick.team}</span>
                      </td>
                    );
                  })}
                  <td>{weeksSurvived(p)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="row wrap" style={{ gap: 12, marginTop: 14, fontSize: 12 }}>
        <span className="row" style={{ gap: 6 }}><i className="c-win" style={{ width: 16, height: 16, borderRadius: 5, display: 'inline-block' }} /> Won</span>
        <span className="row" style={{ gap: 6 }}><i className="c-loss" style={{ width: 16, height: 16, borderRadius: 5, display: 'inline-block' }} /> Lost</span>
        <span className="row" style={{ gap: 6 }}><i className="c-pend" style={{ width: 16, height: 16, borderRadius: 5, display: 'inline-block' }} /> Pending</span>
      </div>
    </div>
  );
}
