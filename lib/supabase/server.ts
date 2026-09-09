import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using the SERVICE ROLE key.
 *
 * Every read and write in this app goes through server actions and server
 * components, so the browser never holds a database credential. Row Level
 * Security is enabled with no public policies (see supabase/schema.sql):
 * the anon key can do nothing, and this key bypasses RLS on the server.
 *
 * Never import this file into a Client Component.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars. Copy .env.example to .env.local and fill in ' +
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
