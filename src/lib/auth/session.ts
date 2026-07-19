import { cookies } from 'next/headers';
import { findUserById } from '@/lib/db/store';
import type { User } from '@/types';

const SESSION_COOKIE = 'splitup_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 1 week

export async function getSession(): Promise<{ user: User } | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const user = findUserById(value);
  return user ? { user } : null;
}

export async function setSession(user: User): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
