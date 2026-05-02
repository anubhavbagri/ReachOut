/**
 * POST /api/generate-email
 * Generate personalized cold emails using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateEmail, generateEmailsBatch } from '@/lib/email-generator';
import { Prospect } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      prospect?: Prospect;
      prospects?: Prospect[];
      context: string;
      tone?: 'professional' | 'friendly' | 'casual';
      aiProvider?: 'openai' | 'google';
      delayMs?: number;
    };

    const {
      prospect,
      prospects,
      context,
      tone = 'professional',
      aiProvider = 'openai',
      delayMs = 500,
    } = body;

    // Validate input
    if (!context || context.trim().length === 0) {
      return NextResponse.json(
        { error: 'Context is required for email generation' },
        { status: 400 }
      );
    }

    // Check API keys
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!hasOpenAI && !hasGoogle) {
      return NextResponse.json(
        {
          error: 'No AI provider configured',
          hint: 'Set OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY',
        },
        { status: 500 }
      );
    }

    // Generate single or batch emails
    if (prospect) {
      const email = await generateEmail(prospect, context, tone, aiProvider);

      return NextResponse.json({
        success: true,
        data: {
          prospectId: prospect.id,
          prospectName: `${prospect.firstName} ${prospect.lastName}`,
          prospectEmail: prospect.email,
          ...email,
          generatedAt: new Date().toISOString(),
          status: 'draft',
        },
      });
    }

    if (prospects && prospects.length > 0) {
      const emails = await generateEmailsBatch(
        prospects,
        context,
        tone,
        undefined,
        aiProvider,
        delayMs
      );

      return NextResponse.json({
        success: true,
        data: emails.map(e => ({
          ...e,
          generatedAt: e.generatedAt.toISOString(),
        })),
        count: emails.length,
      });
    }

    return NextResponse.json(
      { error: 'Either prospect or prospects array is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[v0] Email generation API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate emails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
