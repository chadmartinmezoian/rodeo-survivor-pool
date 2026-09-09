import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

/**
 * Player sessions.
 *
 * The approved design signs in with a name and a 6-digit PIN — no email. That
 * is not something Supabase Auth does natively, so the session is a signed,
 * httpOnly JWT cookie and the PIN itself is bcrypt-hashed in the database.
 * See README → "Moving to Supabase Auth" to switch to magic links instead.
 */
const COOKIE = 'rsp_session';
const MAX_AGE = 60 * 60 * 24 * 120; // a full season on one sign-in

type SessionPayload = { playerId: string; name: string; isCommissioner: boolean };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET must be set to a long random string (see .env.example).');
  }
  return new TextEncoder().encode(s);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      playerId: String(payload.playerId),
      name: String(payload.name),
      isCommissioner: Boolean(payload.isCommissioner)
    };
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
