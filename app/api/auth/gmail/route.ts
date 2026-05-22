import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key);
}

/**
 * GET /api/auth/gmail
 * Initiates Gmail OAuth 2.0 flow, or handles the callback.
 * The refresh token is saved to Supabase server-side — never exposed in the URL.
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
      return redirect('/app/settings?gmail=error&reason=no_code');
    }

    let userEmail = '';
    let errorMsg = '';

    try {
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
        errorMsg = tokens.error || 'token_exchange_failed';
        throw new Error(errorMsg);
      }

      // Get user email
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const profile = await profileRes.json() as { email?: string };
        if (profile.email) userEmail = profile.email;
      } catch {
        userEmail = 'user@gmail.com';
      }

      // ✅ Save to Supabase server-side — token never touches the URL
      const supabase = getSupabaseAdmin();
      if (tokens.refresh_token) {
        await supabase.from('app_config').upsert(
          { key: 'gmail_refresh_token', value: tokens.refresh_token },
          { onConflict: 'key' }
        );
      }
      await supabase.from('app_config').upsert(
        { key: 'gmail_user_email', value: userEmail },
        { onConflict: 'key' }
      );

    } catch (err) {
      const reason = errorMsg || String(err);
      return redirect(`/app/settings?gmail=error&reason=${encodeURIComponent(reason)}`);
    }

    // Redirect with only the email — no token in URL
    return redirect(`/app/settings?gmail=connected&email=${encodeURIComponent(userEmail)}`);
  }

  // ── Initiate OAuth flow ─────────────────────────────────────────
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return redirect('/app/settings?gmail=error&reason=missing_client_id');
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
