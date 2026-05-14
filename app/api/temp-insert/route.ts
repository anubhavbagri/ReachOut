import { NextResponse } from 'next/server';
import { dbInsertRevealedProspect } from '@/lib/supabase-db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await dbInsertRevealedProspect({
      apollo_id: '57deb8ffa6da987af12578c0',
      first_name: 'Shivali',
      last_name: 'Kapoor',
      name: 'Shivali Kapoor',
      linkedin_url: 'http://www.linkedin.com/in/shivalikapoor16',
      title: 'Head - People & Culture',
      organization_id: '64febdead13c690123e63b16',
      email: 'shivali@sahi.com',
      source: 'apollo'
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
