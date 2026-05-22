import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/auth/gmail-status
 * Returns whether Gmail is connected by checking Supabase app_config.
 * Called on every app page load to hydrate the global store.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const [tokenRow, emailRow] = await Promise.all([
      supabase.from('app_config').select('value').eq('key', 'gmail_refresh_token').single(),
      supabase.from('app_config').select('value').eq('key', 'gmail_user_email').single(),
    ]);

    const connected = !!tokenRow.data?.value;
    const email = emailRow.data?.value || '';

    return NextResponse.json({ connected, email });
  } catch {
    return NextResponse.json({ connected: false, email: '' });
  }
}
