'use client';
import { useTransition } from 'react';
import { takeBuyback, declineBuyback } from './actions';

export default function BuybackCard({
  lostTeam, fee, venmo
}: { lostTeam: string; fee: number; venmo: string }) {
  const [pending, start] = useTransition();

  return (
    <div className="card elev-md stitch" style={{ gap: 12 }}>
      <span className="card-kicker">One loss — one way back</span>
      <h2 style={{ margin: 0, fontSize: 26 }}>Buy back in for ${fee}</h2>
      <p className="card-body" style={{ margin: 0 }}>
        Taking the buyback returns <strong>{lostTeam}</strong> to your board — and only that team.
        Everything you've already won with stays used. Tap below and Venmo {venmo}; the
        commissioner sees it on their payments list.
      </p>
      <button
        className="btn btn-primary btn-block"
        style={{ minHeight: 50, fontSize: 16 }}
        disabled={pending}
        onClick={() => start(() => { void takeBuyback(); })}
      >
        {pending ? 'Working…' : 'Take the buyback'}
      </button>
      <button
        className="btn btn-ghost"
        disabled={pending}
        onClick={() => start(() => { void declineBuyback(); })}
      >
        No thanks — I'm out
      </button>
    </div>
  );
}
