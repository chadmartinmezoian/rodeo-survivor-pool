import { redirect } from 'next/navigation';
import { getRoster } from '@/lib/data';
import { getSession } from '@/lib/session';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  if (await getSession()) redirect('/');
  const roster = await getRoster();

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 'clamp(28px, 9vh, 90px)' }}>
      <p className="kicker" style={{ color: 'var(--color-accent-300)', margin: 0 }}>Est. 2019 · 34 Entries</p>
      <h1 style={{ margin: '6px 0 4px', fontSize: 40 }}>Rodeo Survivor Pool</h1>
      <p className="text-muted" style={{ fontSize: 14 }}>
        Pick your name and enter your 6-digit PIN. First time in? The PIN you type becomes yours.
      </p>
      <LoginForm roster={roster} />
    </div>
  );
}
