/**
 * POST /api/generate-email
 * Generate personalized cold emails using Google Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateEmail,
  generateEmailsBatch,
  generateEmailFromDomain,
  generateEmailFromJobDescription,
  ProspectForEmail,
  EmailTone,
} from '@/lib/email-generator';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      prospect?: ProspectForEmail;
      prospects?: ProspectForEmail[];
      context?: string;
      tone?: EmailTone;
      mode?: 'context' | 'domain' | 'jd';
      domain?: string;
      jobDescription?: string;
      delayMs?: number;
    };

    const { prospect, prospects, context = '', tone = 'professional', mode = 'context', domain, jobDescription, delayMs = 600 } = body;

    // Check Gemini key
    if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY not configured. Add it to environment variables.' },
        { status: 500 }
      );
    }

    // Single prospect
    if (prospect) {
      let email: { subject: string; body: string };
      if (mode === 'domain' && domain) {
        email = await generateEmailFromDomain(prospect, domain, tone);
      } else if (mode === 'jd' && jobDescription) {
        email = await generateEmailFromJobDescription(prospect, jobDescription, tone);
      } else {
        email = await generateEmail(prospect, context, tone);
      }
      return NextResponse.json({
        success: true,
        data: {
          prospectId: prospect.id,
          prospectName: `${prospect.firstName} ${prospect.lastName}`,
          prospectEmail: prospect.email,
          ...email,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // Batch
    if (prospects && prospects.length > 0) {
      const emails = await generateEmailsBatch(prospects, context, tone, undefined, delayMs);
      return NextResponse.json({
        success: true,
        data: emails.map(e => ({ ...e, generatedAt: e.generatedAt.toISOString() })),
        count: emails.length,
      });
    }

    return NextResponse.json({ error: 'prospect or prospects required' }, { status: 400 });
  } catch (error) {
    console.error('[ReachOut] Email generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate emails', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
