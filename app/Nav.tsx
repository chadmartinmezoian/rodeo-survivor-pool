'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut } from './actions';

const LINKS = [
  { href: '/', label: 'Make Pick' },
  { href: '/standings', label: 'Picks Grid' },
  { href: '/my-picks', label: 'My Picks' },
  { href: '/rules', label: 'Rules' }
];

export default function Nav({ name, isCommissioner }: { name: string | null; isCommissioner: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  if (path === '/login') return null;

  const links = isCommissioner ? [...LINKS, { href: '/admin', label: 'Admin' }] : LINKS;

  return (
    <header className="nav pagepad" style={{ borderBottom: '1px solid var(--color-divider)' }}>
      <Link href="/" className="nav-brand" style={{ color: 'var(--color-text)' }}>
        Rodeo Survivor Pool
      </Link>

      <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
          {open ? <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></> : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>}
        </svg>
      </button>

      <nav className={'navwrap' + (open ? ' open' : '')}>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={'btn ' + (path === l.href ? 'btn-primary' : 'btn-secondary')}
          >
            {l.label}
          </Link>
        ))}
        <div className="mobonly">
          <span className="text-muted" style={{ fontSize: 13 }}>{name ?? ''}</span>
          <form action={signOut}><button className="btn btn-ghost" type="submit">Sign out</button></form>
        </div>
      </nav>

      {name && (
        <div className="whoami">
          <span className="text-muted" style={{ fontSize: 13 }}>{name}</span>
          <form action={signOut}><button className="btn btn-ghost" type="submit">Sign out</button></form>
        </div>
      )}
    </header>
  );
}
