'use client';
import { useTransition } from 'react';
import { adminSetBuyback } from '../actions';
import PayDot from './PayDot';

/**
 * The commissioner's view of one player's buyback.
 *
 * Most of the group will text "I'm buying back" rather than tapping the button
 * on their own page, so the commissioner needs to grant it for them. Before a
 * loss there's nothing to grant, so the cell just reads a dash.
 */
export default function BuybackCell({
  playerId,
  status,
  paid,
  eligible
}: {
  playerId: string;
  status: string;
  paid: boolean;
  eligible: boolean;
}) {
  const [pending, start] = useTransition();

  function set(next: string) {
    const form = new FormData();
    form.set('playerId', playerId);
    form.set('status', next);
    start(async () => { await adminSetBuyback(form); });
  }

  if (status === 'used') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <PayDot playerId={playerId} field="buyback_paid" paid={paid} label="Buyback" />
        <button type="button" className="btn btn-ghost" disabled={pending}
                onClick={() => set('available')}
                style={{ padding: '4px 10px', fontSize: 12, minHeight: 0 }}>
          Undo
        </button>
      </span>
    );
  }

  if (status === 'declined') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <span className="text-muted">Declined</span>
        <button type="button" className="btn btn-ghost" disabled={pending}
                onClick={() => set('available')}
                style={{ padding: '4px 10px', fontSize: 12, minHeight: 0 }}>
          Undo
        </button>
      </span>
    );
  }

  // Offered but not answered — the commissioner can settle it either way.
  if (eligible) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary" disabled={pending}
                onClick={() => set('used')}
                style={{ padding: '5px 12px', fontSize: 12, minHeight: 0 }}>
          Grant
        </button>
        <button type="button" className="btn btn-ghost" disabled={pending}
                onClick={() => set('declined')}
                style={{ padding: '5px 10px', fontSize: 12, minHeight: 0 }}>
          Out
        </button>
      </span>
    );
  }

  // No loss yet — nothing to offer.
  return <span className="text-muted">—</span>;
}
