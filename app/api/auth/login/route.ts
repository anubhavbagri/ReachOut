import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/middleware';

export const runtime = 'nodejs';

// ── In-memory rate limiter (resets on cold start, good enough for personal use) ──
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetInMs: WINDOW_MS };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetInMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count, resetInMs: entry.resetAt - now };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed, remaining, resetInMs } = checkRateLimit(ip);

  if (!allowed) {
    const minutes = Math.ceil(resetInMs / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
      }
    );
  }

  const body = await request.json() as { username?: string; password?: string };
  const { username, password } = body;

  const expectedUsername = process.env.APP_USERNAME ?? '';
  const expectedPassword = process.env.APP_PASSWORD ?? '';
  const secret           = process.env.APP_SECRET ?? '';

  if (!username || !password || username !== expectedUsername || password !== expectedPassword) {
    return NextResponse.json(
      { error: 'Invalid credentials', attemptsRemaining: remaining },
      { status: 401 }
    );
  }

  // Clear rate limit on successful login
  attempts.delete(ip);

  const token = Buffer.from(`${username}:${password}:${secret}`).toString('base64');

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90, // 90 days
    path: '/',
  });

  return response;
}
