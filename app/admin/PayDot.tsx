'use client';
import { useState, useTransition } from 'react';
import { togglePaid } from '../actions';

/**
 * The paid circle. It flips the instant you tap it and sends the change in the
 * background — waiting a second for the server round-trip made it feel broken.
 * If the save fails, it flips back.
 */
export default function PayDot({
  playerId,
  field,
  paid,
  label
}: {
  playerId: string;
  field: 'entry_paid' | 'buyback_paid';
  paid: boolean;
  label: string;
}) {
  const [on, setOn] = useState(paid);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    const form = new FormData();
    form.set('playerId', playerId);
    form.set('field', field);
    form.set('value', String(next));
    startTransition(async () => {
      try {
        await togglePaid(form);
      } catch {
        setOn(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={'paydot' + (on ? ' on' : '')}
      title={on ? `${label} paid — click to undo` : `Mark ${label.toLowerCase()} paid`}
      aria-pressed={on}
      aria-label={`${label} ${on ? 'paid' : 'owed'}`}
    >
      {on && (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  );
}
