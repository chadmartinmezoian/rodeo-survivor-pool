import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser client on the ANON key. Unused by default — this app reads through
 * server components — but here for when you add Supabase Auth or realtime.
 * It can only see what RLS policies allow, which today is nothing.
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
