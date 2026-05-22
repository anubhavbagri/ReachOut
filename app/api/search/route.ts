/**
 * POST /api/search
 * Search for prospects by company domain using Apollo People Search API
 */

import { NextRequest, NextResponse } from 'next/server';
import { apolloSearchByDomain, sanitizeProspect, DEFAULT_PERSON_TITLES } from '@/lib/api-clients';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      domain: string;
      apolloApiKey?: string;
      personTitles?: string[];
      perPage?: number;
    };

    if (!body.domain) {
      return NextResponse.json({ error: 'domain is required' }, { status: 400 });
    }

    const apiKey = body.apolloApiKey || process.env.APOLLO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Apollo API key required. Set APOLLO_API_KEY env var or pass apolloApiKey in request.' },
        { status: 400 }
      );
    }

    const results = await apolloSearchByDomain(
      body.domain,
      apiKey,
      body.personTitles || DEFAULT_PERSON_TITLES,
      body.perPage || 100
    );

    return NextResponse.json({
      success: true,
      data: results.map(sanitizeProspect),
      count: results.length,
    });
  } catch (error) {
    console.error('[ReachOut] Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
