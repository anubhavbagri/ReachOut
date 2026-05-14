/**
 * Root Middleware — custom username/password auth + protected routes
 * Session stored as a long-lived httpOnly cookie (no Supabase Auth involved).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const SESSION_COOKIE = 'ro_session';

/** Token is base64(username:password:APP_SECRET) — validated on every protected request */
function expectedToken(): string {
  const u = process.env.APP_USERNAME ?? '';
  const p = process.env.APP_PASSWORD ?? '';
  const s = process.env.APP_SECRET ?? '';
  return Buffer.from(`${u}:${p}:${s}`).toString('base64');
}

const PUBLIC = ['/login', '/api/auth/login', '/api/auth/logout'];
const STATIC = ['/_next', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC.some(s => pathname.startsWith(s))) return NextResponse.next();
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname === '/') return NextResponse.next();

  const session = request.cookies.get(SESSION_COOKIE);
  const valid = session?.value === expectedToken();

  if (!valid) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
