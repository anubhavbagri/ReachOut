import { NextRequest, NextResponse } from 'next/server';
import { contactOutFindEmail } from '@/lib/api-clients';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const { linkedinUrl } = await req.json() as { linkedinUrl: string };
  const key = process.env.CONTACTOUT_API_KEY;
  if (!key) return NextResponse.json({ error: 'CONTACTOUT_API_KEY not set' }, { status: 500 });
  if (!linkedinUrl) return NextResponse.json({ error: 'linkedinUrl required' }, { status: 400 });
  try {
    const result = await contactOutFindEmail(linkedinUrl, key);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
