import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_TOKEN_COOKIE } from './api';

/**
 * Returns auth token from cookies (server-side only).
 * Returns null if not authenticated.
 */
export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const tokenRaw = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  return tokenRaw ? decodeURIComponent(tokenRaw) : null;
}

/**
 * Auth gate for protected routes. Call in layout.
 * Redirects to /login if user is not authenticated (SSR).
 * Returns the token if authenticated.
 */
export async function requireAuth(): Promise<string> {
  const token = await getTokenFromCookies();
  if (!token) {
    redirect('/login');
  }
  return token;
}
