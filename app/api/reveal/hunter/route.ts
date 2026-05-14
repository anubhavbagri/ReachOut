import { NextRequest, NextResponse } from 'next/server';
import { hunterFindEmail, normalizeDomain } from '@/lib/api-clients';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const { firstName, lastName, website } = await req.json() as { firstName: string; lastName: string; website: string };
  const key = process.env.HUNTER_API_KEY;
  if (!key) return NextResponse.json({ error: 'HUNTER_API_KEY not set' }, { status: 500 });
  try {
    const domain = normalizeDomain(website);
    const email = await hunterFindEmail(firstName, lastName, domain, key);
    return NextResponse.json({ email });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
