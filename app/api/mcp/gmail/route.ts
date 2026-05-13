/**
 * POST /api/mcp/gmail
 * Gmail send endpoint — uses OAuth refresh token to send real emails via Gmail API
 * 
 * This runs as a Next.js API route on Vercel (serverless).
 * The refresh token is obtained via /api/auth/gmail OAuth flow.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  error?: string;
}

/**
 * Exchange refresh token for a fresh access token
 */
async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  const data = (await res.json()) as TokenResponse;
  if (data.error || !data.access_token) {
    throw new Error(`Failed to refresh token: ${data.error}`);
  }
  return data.access_token;
}

/**
 * Encode an email message in RFC 2822 format (base64url)
 */
function encodeEmail(to: string, from: string, subject: string, body: string): string {
  const message = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    body,
  ].join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * GET — server info / health check
 */
export async function GET() {
  return NextResponse.json({
    name: 'gmail-sender',
    version: '2.0.0',
    status: 'ready',
    description: 'Sends emails via Gmail API using OAuth2 refresh tokens',
  });
}

/**
 * POST — send email(s)
 * Body: { refreshToken, to, subject, body, fromEmail? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      refreshToken: string;
      to: string;
      subject: string;
      body: string;
      fromEmail?: string;
    };

    const { refreshToken, to, subject, body: emailBody, fromEmail } = body;

    if (!refreshToken || !to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: refreshToken, to, subject, body' },
        { status: 400 }
      );
    }

    // 1. Get fresh access token
    const accessToken = await getAccessToken(refreshToken);

    // 2. Get sender's email address if not provided
    let senderEmail = fromEmail;
    if (!senderEmail) {
      const profileRes = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const profile = await profileRes.json() as { email: string };
      senderEmail = profile.email;
    }

    // 3. Build and send the email
    const raw = encodeEmail(to, senderEmail, subject, emailBody);

    const sendRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      }
    );

    if (!sendRes.ok) {
      const err = await sendRes.json();
      console.error('[ReachOut] Gmail send error:', err);
      return NextResponse.json(
        { error: 'Gmail API error', details: err },
        { status: sendRes.status }
      );
    }

    const result = await sendRes.json() as { id: string; threadId: string };

    return NextResponse.json({
      success: true,
      messageId: result.id,
      threadId: result.threadId,
      sentAt: new Date().toISOString(),
      to,
      subject,
      fromEmail: senderEmail,
    });
  } catch (error) {
    console.error('[ReachOut] Send email error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
