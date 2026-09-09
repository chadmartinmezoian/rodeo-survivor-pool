'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { submitPick } from './actions';

function SubmitButton({ locked, saved }: { locked: boolean; saved: string | null | undefined }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary btn-block" style={{ minHeight: 50, fontSize: 16 }} disabled={locked || pending}>
      {pending ? 'Saving…' : locked ? 'Closed' : saved ? 'Update pick' : 'Submit pick'}
    </button>
  );
}

type Option = { code: string; label: string };

export default function PickForm({
  options, currentTeam, locked, week
}: { options: Option[]; currentTeam: string | null; locked: boolean; week: number }) {
  const [state, action] = useFormState(submitPick, null as null | { error?: string; ok?: boolean; team?: string });
  const saved = state?.ok ? state.team : currentTeam;

  return (
    <form action={action} className="card elev-md" style={{ gap: 14 }}>
      <span className="card-kicker">Week {week} pick</span>
      <h2 style={{ margin: 0, fontSize: 26 }}>
        {locked ? 'Picks are closed' : saved ? 'Change your pick' : 'Make your pick'}
      </h2>

      {saved && (
        <p style={{ margin: 0, fontSize: 14 }}>
          Locked in: <strong>{saved}</strong>
        </p>
      )}

      <label className="field">
        <span style={{ display: 'block', fontSize: 12, marginBottom: 5, opacity: 0.7 }}>
          Winner this week — teams you've used are gone for good
        </span>
        <select
          name="team"
          className="input"
          required
          disabled={locked}
          defaultValue={saved ?? ''}
          style={{ minHeight: 48 }}
        >
          <option value="" disabled>Choose a team…</option>
          {options.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
        </select>
      </label>

      {state?.error && <p style={{ margin: 0, fontSize: 13, color: 'var(--color-accent-300)' }}>{state.error}</p>}

      <SubmitButton locked={locked} saved={saved} />
      <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
        You can change your pick any time before the deadline.
      </p>
    </form>
  );
}
