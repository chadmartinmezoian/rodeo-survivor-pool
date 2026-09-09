import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getPool } from '@/lib/data';
import { amountOwed, statusOf, STATUS_META } from '@/lib/survivor';
import { deadlineLabel } from '@/lib/schedule';
import { setCurrentWeek, togglePaid, setGameWinner, setWeekFinal, adminSetPick, addPlayer, renamePlayer, removePlayer, resetPin } from '../actions';
import { TEAMS, teamName } from '@/lib/nfl';

const COMMISSIONERS = ['Jason Bottoms', 'Chad Mezoian'];

export default async function AdminPage({ searchParams }: { searchParams?: { saved?: string } }) {
  const saved = searchParams?.saved;
  const session = await getSession();
  if (!session) redirect('/login');

  const { settings, players, week, games, weeks } = await getPool();
  const me = players.find(p => p.id === session.playerId);
  // Second gate: the page itself refuses to render for anyone else.
  if (!me?.is_commissioner || !COMMISSIONERS.includes(me.name)) {
    return (
      <div style={{ paddingTop: 40 }}>
        <h1>Commissioners only</h1>
        <p className="text-muted">This page is for Jason and Chad.</p>
      </div>
    );
  }

  const owing = players
    .map(p => ({ p, owed: amountOwed(p, settings.entry_fee, settings.buyback_fee) }))
    .filter(x => x.owed > 0);

  return (
    <div style={{ paddingTop: 26 }}>
      <p className="kicker" style={{ color: 'var(--color-accent-300)', margin: 0 }}>Commissioner</p>
      <h1 style={{ margin: '4px 0 18px' }}>Admin</h1>

      <div className="grid-cards cols-2">
        <div className="card elev-md">
          <span className="card-kicker">This week</span>
          <h2 style={{ margin: 0, fontSize: 22 }}>Week {settings.current_week}</h2>
          <p className="card-body" style={{ margin: 0 }}>{deadlineLabel(week)}</p>
          <form action={setCurrentWeek} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select name="week" className="input" defaultValue={settings.current_week} style={{ width: 120 }}>
              {weeks.map(w => <option key={w.week} value={w.week}>Week {w.week}</option>)}
            </select>
            <button className="btn btn-secondary">Set current week</button>
          </form>
          <form action={setWeekFinal} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="hidden" name="week" value={settings.current_week} />
            <input type="hidden" name="isFinal" value={String(!week?.is_final)} />
            <button className="btn btn-ghost">
              {week?.is_final ? 'Reopen week (undo final)' : 'Mark week final & grade'}
            </button>
          </form>
        </div>

        <div className="card elev-md">
          <span className="card-kicker">Payments owed</span>
          <h2 style={{ margin: 0, fontSize: 22 }}>
            ${owing.reduce((s, x) => s + x.owed, 0)} outstanding
          </h2>
          {owing.length === 0 ? (
            <p className="card-body" style={{ margin: 0 }}>Everyone's square.</p>
          ) : (
            <div className="stack" style={{ gap: 8 }}>
              {owing.map(({ p, owed }) => (
                <div key={p.id} className="row wrap" style={{ gap: 8, justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14 }}>
                    {p.name} <span className="text-muted">owes ${owed}</span>
                  </span>
                  <span className="row" style={{ gap: 6 }}>
                    {!p.entry_paid && (
                      <form action={togglePaid}>
                        <input type="hidden" name="playerId" value={p.id} />
                        <input type="hidden" name="field" value="entry_paid" />
                        <input type="hidden" name="value" value="true" />
                        <button className="btn btn-secondary" style={{ fontSize: 12 }}>Entry paid</button>
                      </form>
                    )}
                    {p.buyback_status === 'used' && !p.buyback_paid && (
                      <form action={togglePaid}>
                        <input type="hidden" name="playerId" value={p.id} />
                        <input type="hidden" name="field" value="buyback_paid" />
                        <input type="hidden" name="value" value="true" />
                        <button className="btn btn-secondary" style={{ fontSize: 12 }}>Buyback paid</button>
                      </form>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: 22, marginTop: 30 }}>Week {settings.current_week} results</h2>
      <p className="text-muted" style={{ fontSize: 13, marginTop: -8 }}>
        Set a winner and every pick for that game grades itself.
      </p>
      <div className="card elev-md" style={{ padding: 6 }}>
        <table className="table stack-table">
          <thead><tr><th>Game</th><th>Winner</th></tr></thead>
          <tbody>
            {games.length === 0 && <tr><td colSpan={2} className="text-muted">No games loaded for this week.</td></tr>}
            {games.map(g => (
              <tr key={g.id}>
                <td data-label="Game">{teamName(g.away)} at {teamName(g.home)}</td>
                <td data-label="Winner">
                  <form action={setGameWinner} className="row" style={{ gap: 6 }}>
                    <input type="hidden" name="gameId" value={g.id} />
                    <select name="winner" className="input" defaultValue={g.is_tie ? 'TIE' : g.winner ?? ''} style={{ width: 190, maxWidth: '100%' }}>
                      <option value="">Not played</option>
                      <option value={g.away}>{teamName(g.away)}</option>
                      <option value={g.home}>{teamName(g.home)}</option>
                      <option value="TIE">Tie</option>
                    </select>
                    <button className="btn btn-secondary" style={{ fontSize: 12 }}>Save</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="backfill" style={{ fontSize: 22, marginTop: 30, scrollMarginTop: 16 }}>Backfill a pick</h2>
      <p className="text-muted" style={{ fontSize: 13, marginTop: -8 }}>
        For the guy who texted you his pick. Any player, any week.
      </p>
      {saved && (
        <div className="card elev-sm" style={{
          marginBottom: 12, background: 'var(--color-accent-2-100)',
          borderColor: 'var(--color-accent-2)', color: 'var(--color-accent-2-900)'
        }}>
          <strong style={{ fontFamily: 'var(--font-heading)' }}>Saved.</strong> {saved}
        </div>
      )}
      <form action={adminSetPick} className="card elev-md">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', width: '100%' }}>
        <label className="field" style={{ flex: '1 1 200px' }}>
          <span style={{ display: 'block', fontSize: 12, marginBottom: 5, opacity: 0.7 }}>Player</span>
          <select name="playerId" className="input" required defaultValue="">
            <option value="" disabled>Choose…</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="field" style={{ flex: '0 1 120px' }}>
          <span style={{ display: 'block', fontSize: 12, marginBottom: 5, opacity: 0.7 }}>Week</span>
          <select name="week" className="input" defaultValue={settings.current_week}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.week}</option>)}
          </select>
        </label>
        <label className="field" style={{ flex: '1 1 200px' }}>
          <span style={{ display: 'block', fontSize: 12, marginBottom: 5, opacity: 0.7 }}>Team</span>
          <select name="team" className="input" defaultValue="">
            <option value="">— clear the pick —</option>
            {TEAMS.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
          </select>
        </label>
        <button className="btn btn-primary" style={{ flex: '0 0 auto' }}>Save pick</button>
        </div>
      </form>

      <h2 style={{ fontSize: 22, marginTop: 30 }}>Roster · {players.length} players</h2>
      <p className="text-muted" style={{ fontSize: 13, marginTop: -8 }}>
        Add, rename or remove anyone here. Editing a name keeps their picks.
      </p>

      <form action={addPlayer} className="card elev-md">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', width: '100%' }}>
        <label className="field" style={{ flex: '1 1 240px' }}>
          <span style={{ display: 'block', fontSize: 12, marginBottom: 5, opacity: 0.7 }}>Add a player</span>
          <input name="name" className="input" placeholder="First Last" required />
        </label>
        <button className="btn btn-primary" style={{ flex: '0 0 auto' }}>Add to pool</button>
        </div>
      </form>

      <div className="card elev-md" style={{ padding: 6, marginTop: 18 }}>
        <table className="table stack-table">
          <thead><tr><th>Player</th><th>Status</th><th>Entry</th><th>Buyback</th><th>PIN</th><th /></tr></thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id}>
                <td data-label="Player">
                  <form action={renamePlayer} className="row" style={{ gap: 6 }}>
                    <input type="hidden" name="playerId" value={p.id} />
                    <input name="name" className="input" defaultValue={p.name} style={{ width: 170, maxWidth: '100%', minHeight: 32 }} />
                    <button className="btn btn-ghost" style={{ fontSize: 12 }}>Save</button>
                  </form>
                </td>
                <td data-label="Status"><span className={'tag ' + STATUS_META[statusOf(p)].cls}>{STATUS_META[statusOf(p)].label}</span></td>
                <td data-label="Entry">{p.entry_paid ? 'Paid' : <span className="text-muted">Owed</span>}</td>
                <td data-label="Buyback">{p.buyback_status === 'used' ? (p.buyback_paid ? 'Paid' : 'Owed') : <span className="text-muted">{p.buyback_status}</span>}</td>
                <td data-label="PIN">
                  {p.has_pin ? (
                    <form action={resetPin}>
                      <input type="hidden" name="playerId" value={p.id} />
                      <button className="btn btn-ghost" style={{ fontSize: 12 }}>Reset PIN</button>
                    </form>
                  ) : <span className="text-muted">Not set</span>}
                </td>
                <td>
                  {p.picks.length === 0 && !p.is_commissioner && (
                    <form action={removePlayer}>
                      <input type="hidden" name="playerId" value={p.id} />
                      <button className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--color-accent-300)' }}>Remove</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
