'use client';
import { useActionState } from 'react';
import { signIn } from '../actions';

type Entry = { id: string; name: string; has_pin: boolean };

export default function LoginForm({ roster }: { roster: Entry[] }) {
  const [state, action, pending] = useActionState(signIn, null as null | { error?: string });

  return (
    <form action={action} className="card elev-md stack" style={{ gap: 14, marginTop: 20 }}>
      <label className="field">
        <span style={{ display: 'block', fontSize: 12, marginBottom: 5, opacity: 0.7 }}>Your name</span>
        <select name="playerId" className="input" required defaultValue="" style={{ minHeight: 48 }}>
          <option value="" disabled>Choose your name…</option>
          {roster.map(p => (
            <option key={p.id} value={p.id}>{p.name}{p.has_pin ? '' : ' — set a PIN'}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span style={{ display: 'block', fontSize: 12, marginBottom: 5, opacity: 0.7 }}>6-digit PIN</span>
        <input
          name="pin"
          className="input"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="······"
          required
          style={{ minHeight: 48, letterSpacing: '0.5em', textAlign: 'center', fontSize: 20 }}
        />
      </label>

      {state?.error && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-accent-300)' }}>{state.error}</p>
      )}

      <button className="btn btn-primary btn-block" style={{ minHeight: 50, fontSize: 16 }} disabled={pending}>
        {pending ? 'Checking…' : 'Sign in'}
      </button>
      <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
        You stay signed in on this device for the season.
      </p>
    </form>
  );
}
