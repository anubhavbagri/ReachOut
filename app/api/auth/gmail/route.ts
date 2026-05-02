import { redirect } from 'next/navigation';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
];

/**
 * GET /api/auth/gmail
 * Initiates Gmail OAuth 2.0 flow
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'callback') {
      // Handle OAuth callback
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        return Response.json(
          { error: 'No authorization code received' },
          { status: 400 }
        );
      }

      // Exchange code for tokens (in production, do this securely on backend)
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/auth/gmail?action=callback`,
          grant_type: 'authorization_code',
        }).toString(),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        return Response.json(
          { error: 'Failed to obtain tokens: ' + tokens.error },
          { status: 400 }
        );
      }

      // Store tokens in environment or session (simplified for demo)
      // In production, encrypt and store securely
      const gmailAuth = {
        isAuthenticated: true,
        userEmail: tokens.email || 'user@gmail.com',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      };

      // Redirect back to settings with success
      return redirect(
        `/app/settings?gmail=connected&email=${encodeURIComponent(gmailAuth.userEmail)}`
      );
    }

    // Initiate OAuth flow
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return Response.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', 
      `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/auth/gmail?action=callback`
    );
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', SCOPES.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');

    return redirect(authUrl.toString());
  } catch (error) {
    console.error('[v0] Gmail OAuth error:', error);
    return Response.json(
      { error: 'OAuth flow failed' },
      { status: 500 }
    );
  }
}
