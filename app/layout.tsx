import './globals.css';
import type { Metadata } from 'next';
import Nav from './Nav';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Rodeo Survivor Pool',
  description: 'NFL survivor pool — one team a week, win or go home.'
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en">
      <body>
        <Nav name={session?.name ?? null} isCommissioner={Boolean(session?.isCommissioner)} />
        <main className="pagepad" style={{ paddingBottom: 60 }}>{children}</main>
      </body>
    </html>
  );
}
