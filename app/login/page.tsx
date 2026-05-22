'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, User, Mail } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/app';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [rateLimited, setRateLimited] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json() as { error?: string };
      if (res.status === 429) {
        setRateLimited(true);
        setError(data.error ?? 'Too many attempts. Try again later.');
        return;
      }
      if (!res.ok) {
        setError('Invalid username or password');
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'oklch(0.96 0.02 65)' }}
    >
      {/* Warm ambient blobs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[140px] opacity-40"
          style={{ background: 'oklch(0.78 0.14 40)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[140px] opacity-30"
          style={{ background: 'oklch(0.74 0.12 50)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[200px] opacity-20"
          style={{ background: 'oklch(0.68 0.08 160)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo mark */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 clay-shadow"
            style={{ background: 'oklch(0.58 0.2 25)' }}
          >
            <Mail className="w-8 h-8" style={{ color: 'oklch(0.98 0.01 70)' }} />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'oklch(0.22 0.04 45)' }}
          >
            ReachOut
          </h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.50 0.04 55)' }}>
            Your personal cold outreach agent
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 clay-shadow"
          style={{
            background: 'oklch(0.99 0.008 68)',
            border: '1px solid oklch(0.88 0.025 60)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'oklch(0.50 0.04 55)' }}
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'oklch(0.65 0.08 45)' }}
                />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm transition-all outline-none clay-inset"
                  style={{
                    background: 'oklch(0.95 0.015 68)',
                    border: '1.5px solid oklch(0.85 0.03 55)',
                    color: 'oklch(0.22 0.04 45)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'oklch(0.58 0.2 25)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'oklch(0.85 0.03 55)')}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'oklch(0.50 0.04 55)' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'oklch(0.65 0.08 45)' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm transition-all outline-none clay-inset"
                  style={{
                    background: 'oklch(0.95 0.015 68)',
                    border: '1.5px solid oklch(0.85 0.03 55)',
                    color: 'oklch(0.22 0.04 45)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'oklch(0.58 0.2 25)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'oklch(0.85 0.03 55)')}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm text-center"
                style={{
                  background: 'oklch(0.96 0.04 25)',
                  border: '1px solid oklch(0.85 0.1 25)',
                  color: 'oklch(0.45 0.18 22)',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password || rateLimited}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed clay-shadow"
              style={{
                background: 'oklch(0.58 0.2 25)',
                color: 'oklch(0.98 0.01 70)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'oklch(0.54 0.21 25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'oklch(0.58 0.2 25)'; }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                : 'Sign In'
              }
            </button>
          </form>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: 'oklch(0.65 0.04 55)' }}
        >
          Private access only
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
