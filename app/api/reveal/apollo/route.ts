import { NextRequest, NextResponse } from 'next/server';
import { apolloRevealEmail } from '@/lib/api-clients';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const { prospectId } = await req.json() as { prospectId: string };
  const key = process.env.APOLLO_API_KEY;
  if (!key) return NextResponse.json({ error: 'APOLLO_API_KEY not set' }, { status: 500 });
  try {
    const result = await apolloRevealEmail(prospectId, key);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
