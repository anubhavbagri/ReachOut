import { NextRequest, NextResponse } from 'next/server';
import { hunterFindEmail, normalizeDomain } from '@/lib/api-clients';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const { firstName, lastName, website } = await req.json() as { firstName: string; lastName: string; website: string };
  const key = process.env.HUNTER_API_KEY;
  if (!key) return NextResponse.json({ error: 'HUNTER_API_KEY not set' }, { status: 500 });
  try {
    const domain = normalizeDomain(website);
    const data = await hunterFindEmail(firstName, lastName, domain, key);
    if (!data?.email) return NextResponse.json({ email: null });
    return NextResponse.json({
      email: data.email,
      firstName: data.first_name || firstName,
      lastName: data.last_name || lastName,
      company: data.company || website,
      domain: data.domain || domain,
      title: data.position || null,
      linkedin: data.linkedin_url || null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
