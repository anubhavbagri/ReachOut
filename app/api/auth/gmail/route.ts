import { redirect } from 'next/navigation';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * GET /api/auth/gmail
 * Initiates Gmail OAuth 2.0 flow, or handles the callback.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const redirectUri = `${baseUrl}/api/auth/gmail?action=callback`;

  // ── OAuth Callback ──────────────────────────────────────────────
  if (action === 'callback') {
    const code = searchParams.get('code');

    if (!code) {
      return Response.json({ error: 'No authorization code received' }, { status: 400 });
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokens = await tokenRes.json() as {
      access_token?: string;
      refresh_token?: string;
      error?: string;
    };

    if (tokens.error || !tokens.access_token) {
      return Response.json({ error: `Token exchange failed: ${tokens.error}` }, { status: 400 });
    }

    // Get user email
    let userEmail = 'user@gmail.com';
    try {
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileRes.json() as { email?: string };
      if (profile.email) userEmail = profile.email;
    } catch {
      // Non-fatal — we still have the tokens
    }

    // Pass tokens back to client via query params (client stores them in Zustand)
    const callbackParams = new URLSearchParams({
      gmail: 'connected',
      email: userEmail,
      ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    });

    return redirect(`/app/settings?${callbackParams.toString()}`);
  }

  // ── Initiate OAuth flow ─────────────────────────────────────────
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: 'GOOGLE_CLIENT_ID not configured in environment variables' }, { status: 500 });
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent'); // Force refresh_token to be returned

  return redirect(authUrl.toString());
}
