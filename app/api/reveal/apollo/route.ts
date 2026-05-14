import { NextRequest, NextResponse } from 'next/server';
import { apolloRevealEmail } from '@/lib/api-clients';
import { dbInsertRevealedProspect } from '@/lib/supabase-db';

export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const { prospectId } = await req.json() as { prospectId: string };
  const key = process.env.APOLLO_API_KEY;
  if (!key) return NextResponse.json({ error: 'APOLLO_API_KEY not set' }, { status: 500 });
  try {
    const result = await apolloRevealEmail(prospectId, key);
    
    if (result.email && result.details) {
      const d = result.details;
      const companyName = (d.employment_history as any[])?.[0]?.organization_name || undefined;
      await dbInsertRevealedProspect({
        apollo_id: d.id as string | undefined,
        first_name: d.first_name as string | undefined,
        last_name: d.last_name as string | undefined,
        name: d.name as string | undefined,
        linkedin_url: d.linkedin_url as string | undefined,
        title: d.title as string | undefined,
        organization_id: d.organization_id as string | undefined,
        company: companyName as string | undefined,
        email: result.email,
        source: 'apollo'
      });
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
