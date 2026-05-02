/**
 * POST /api/search
 * Search for prospects using Apollo/Hunter with fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchProspectsWithFallback, sanitizeProspect } from '@/lib/api-clients';
import { SearchQuery } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SearchQuery;

    // Validate input
    if (!body.keywords || body.keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords are required' },
        { status: 400 }
      );
    }

    // Get API keys from environment
    const apolloKey = process.env.APOLLO_API_KEY;
    const hunterKey = process.env.HUNTER_API_KEY;
    const demoMode = process.env.DEMO_MODE === 'true';

    // If demo mode, skip real API calls
    if (demoMode && !apolloKey && !hunterKey) {
      console.log('[v0] Using demo mode for search');
    }

    // Perform search with fallback chain
    const results = await searchProspectsWithFallback(
      body,
      apolloKey,
      hunterKey
    );

    // Sanitize and validate results
    const sanitized = results.map(sanitizeProspect);

    // Validate emails
    const validResults = sanitized.filter(p => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(p.email);
    });

    return NextResponse.json({
      success: true,
      data: validResults,
      count: validResults.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[v0] Search API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to search prospects',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
