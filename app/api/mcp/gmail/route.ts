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
 * Encode a header value using RFC 2047 if it contains non-ASCII characters
 */
function encodeHeader(value: string): string {
  // Check if value contains non-ASCII characters
  if (/[^\x00-\x7F]/.test(value)) {
    const encoded = Buffer.from(value, 'utf-8').toString('base64');
    return `=?UTF-8?B?${encoded}?=`;
  }
  return value;
}

/**
 * Convert plain-text body to HTML preserving paragraph structure.
 * - Double newlines (\n\n) → paragraph breaks (<p>)
 * - Single newlines within a paragraph → space (avoid mid-sentence <br>)
 * - Exception: trailing "Name" line in signature separated by \n → <br>
 */
function textToHtml(text: string): string {
  // Escape HTML entities
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Split on double newlines (paragraph breaks)
  const paragraphs = escaped.split(/\n\n+/);

  return paragraphs
    .map(para => {
      // For short paragraphs with a single \n (like "Thanks for considering,\nAnubhav"),
      // preserve the break. For longer paragraphs, treat \n as a space.
      const lines = para.split('\n');
      const html = lines.every(l => l.length < 60)
        ? lines.join('<br>')        // short lines (signature) → keep breaks
        : lines.join(' ');          // long lines (prose) → join as one sentence
      return `<p style="margin:0 0 16px 0;line-height:1.6">${html}</p>`;
    })
    .join('');
}

/**
 * Encode an email message in RFC 2822 format (base64url)
 * When replyMessageId is provided, adds In-Reply-To / References headers
 * so Gmail threads the reply correctly.
 */
function encodeEmail(
  to: string,
  from: string,
  fromName: string,
  subject: string,
  body: string,
  replyMessageId?: string,
): string {
  const fromHeader = fromName
    ? `${encodeHeader(fromName)} <${from}>`
    : from;

  const htmlBody = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a">${textToHtml(body)}</body></html>`;

  const headers = [
    `To: ${to}`,
    `From: ${fromHeader}`,
    `Subject: ${encodeHeader(subject)}`,
  ];

  // Thread reply headers
  if (replyMessageId) {
    headers.push(`In-Reply-To: ${replyMessageId}`);
    headers.push(`References: ${replyMessageId}`);
  }

  headers.push(
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
  );

  const message = [...headers, '', htmlBody].join('\r\n');

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
      to: string;
      subject: string;
      body: string;
      fromEmail?: string;
      fromName?: string;
      threadId?: string;
    };

    const { to, subject, body: emailBody, fromEmail, fromName, threadId } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Load refresh token from Supabase app_config
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();
    const { data: tokenRow } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'gmail_refresh_token')
      .single();

    const refreshToken = tokenRow?.value;
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Gmail not connected. Go to Settings to connect your Gmail account.' },
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
    // If threadId is provided, fetch the original message ID for In-Reply-To header
    let replyMessageId: string | undefined;
    if (threadId) {
      try {
        const threadRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=Message-Id`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (threadRes.ok) {
          const threadData = await threadRes.json() as { messages?: { payload?: { headers?: { name: string; value: string }[] } }[] };
          const lastMsg = threadData.messages?.[threadData.messages.length - 1];
          replyMessageId = lastMsg?.payload?.headers?.find((h: { name: string }) => h.name === 'Message-Id')?.value;
        }
      } catch { /* proceed without threading headers */ }
    }

    const raw = encodeEmail(to, senderEmail, fromName || '', subject, emailBody, replyMessageId);

    const sendPayload: { raw: string; threadId?: string } = { raw };
    if (threadId) sendPayload.threadId = threadId;

    const sendRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendPayload),
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
