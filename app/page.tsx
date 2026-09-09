import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getPool } from '@/lib/data';
import { deadlineLabel, isLocked, matchupLabel } from '@/lib/schedule';
import { statusOf, playableTeams, burnedTeams, weeksSurvived, STATUS_META } from '@/lib/survivor';
import PickForm from './PickForm';
import BuybackCard from './BuybackCard';

export default async function MakePickPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { settings, players, week, games } = await getPool();
  const me = players.find(p => p.id === session.playerId);
  if (!me) redirect('/login');

  const status = statusOf(me);
  const locked = isLocked(week);
  const current = me.picks.find(p => p.week === settings.current_week);
  const options = playableTeams(me, week?.byes ?? []).map(t => ({
    code: t.code,
    label: matchupLabel(games, t.code)
  }));

  return (
    <div style={{ paddingTop: 26 }}>
      <p className="kicker" style={{ color: 'var(--color-accent-300)', margin: 0 }}>
        Week {settings.current_week} of {settings.total_weeks}
      </p>
      <h1 style={{ margin: '4px 0 2px' }}>Hey, {me.name.split(' ')[0]}</h1>
      <div className="row wrap" style={{ gap: 10, marginBottom: 22 }}>
        <span className={'tag ' + STATUS_META[status].cls}>{STATUS_META[status].label}</span>
        <span className="text-muted" style={{ fontSize: 13 }}>{deadlineLabel(week)}</span>
      </div>

      <div className="grid-cards cols-2">
        {status === 'buyback' ? (
          <BuybackCard
            lostTeam={me.picks.find(p => p.result === 'lost')?.team ?? ''}
            fee={settings.buyback_fee}
            venmo={settings.venmo_handle}
          />
        ) : status === 'eliminated' ? (
          <div className="card elev-md">
            <span className="card-kicker">Season over</span>
            <h2 style={{ margin: 0, fontSize: 24 }}>You're out</h2>
            <p className="card-body">
              Two losses ends it. Stick around for the standings — and the ribbing.
            </p>
          </div>
        ) : (
          <PickForm
            options={options}
            currentTeam={current?.team ?? null}
            locked={locked}
            week={settings.current_week}
          />
        )}

        <div className="stack" style={{ gap: 18 }}>
          <div className="card elev-sm">
            <span className="card-kicker">Your season</span>
            <div className="row" style={{ gap: 22 }}>
              <div>
                <div className="bignum">{weeksSurvived(me)}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>weeks survived</div>
              </div>
              <div>
                <div className="bignum">{32 - burnedTeams(me).length}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>teams left</div>
              </div>
            </div>
          </div>

          <div className="card elev-sm">
            <span className="card-kicker">Teams you've used</span>
            {burnedTeams(me).length === 0 ? (
              <p className="card-body" style={{ margin: 0 }}>None yet — the whole league is open.</p>
            ) : (
              <div className="row wrap" style={{ gap: 6 }}>
                {burnedTeams(me).map(t => <span key={t} className="tag tag-neutral">{t}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
