/**
 * AI Email Generation
 * Uses OpenAI/Gemini to draft personalized cold emails
 */

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { Prospect } from './types';

const SYSTEM_PROMPT = `You are an expert at writing personalized cold outreach emails that:
- Start with a genuine, specific compliment or observation about the person/company
- Clearly state your value proposition in 1-2 sentences
- Include ONE specific, relevant piece of information about them
- End with a low-pressure CTA (suggest a 15-min call, not a full demo)
- Keep subject lines under 50 characters
- Keep email body under 150 words
- Sound natural and conversational, not salesy
- Avoid overpromising or using hype language`;

export async function generateEmail(
  prospect: Prospect,
  context: string,
  tone: 'professional' | 'friendly' | 'casual' = 'professional',
  aiProvider: 'openai' | 'google' = 'openai'
) {
  const model = aiProvider === 'openai' ? openai('gpt-4o-mini') : google('gemini-1.5-flash');

  const toneGuidance = {
    professional: 'Keep a formal, business-appropriate tone.',
    friendly: 'Be warm and personable, like talking to a colleague.',
    casual: 'Sound conversational and relaxed, almost like a peer reaching out.',
  };

  const userPrompt = `
Write a cold outreach email to this prospect:

Name: ${prospect.firstName} ${prospect.lastName}
Title: ${prospect.title}
Company: ${prospect.company}
Location: ${prospect.location || 'Unknown'}
Industry: ${prospect.industry || 'Unknown'}
Context/Notes: ${context}

Tone: ${toneGuidance[tone]}

IMPORTANT: Return ONLY valid JSON in this exact format, no markdown:
{
  "subject": "subject line here",
  "body": "email body here"
}
`;

  try {
    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
      maxOutputTokens: 500,
    });

    // Parse the response - handle potential JSON extraction
    let jsonStr = result.text.trim();
    
    // If wrapped in markdown code blocks, extract
    const jsonMatch = jsonStr.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);

    return {
      subject: parsed.subject || '(Error parsing subject)',
      body: parsed.body || '(Error parsing body)',
    };
  } catch (error) {
    console.error('[v0] Email generation error:', error);
    
    // Fallback to template if AI fails
    return {
      subject: `Quick thought about ${prospect.company}`,
      body: `Hi ${prospect.firstName},

I noticed ${prospect.company} is doing some interesting work in the ${prospect.industry} space.

Would love to grab a quick 15-min call to explore how we might help.

Best,
[Your name]`,
    };
  }
}

/**
 * Batch generate emails for multiple prospects
 * Includes rate limiting to respect API quotas
 */
export async function generateEmailsBatch(
  prospects: Prospect[],
  context: string,
  tone: 'professional' | 'friendly' | 'casual' = 'professional',
  onProgress?: (current: number, total: number) => void,
  aiProvider: 'openai' | 'google' = 'openai',
  delayMs: number = 500
) {
  const emails = [];

  for (let i = 0; i < prospects.length; i++) {
    try {
      const email = await generateEmail(
        prospects[i],
        context,
        tone,
        aiProvider
      );

      emails.push({
        prospectId: prospects[i].id,
        prospectName: `${prospects[i].firstName} ${prospects[i].lastName}`,
        prospectEmail: prospects[i].email,
        ...email,
        generatedAt: new Date(),
        status: 'draft' as const,
      });

      onProgress?.(i + 1, prospects.length);

      // Rate limiting delay
      if (i < prospects.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(
        `[v0] Failed to generate email for ${prospects[i].email}:`,
        error
      );
      // Continue with next prospect
    }
  }

  return emails;
}

/**
 * Personalize email with variable substitution
 */
export function personalizeEmail(
  template: string,
  variables: Record<string, string>
): string {
  let personalized = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'gi');
    personalized = personalized.replace(regex, value);
  });

  return personalized;
}

/**
 * Extract variables from template (e.g., {{firstName}}, {{company}})
 */
export function extractTemplateVariables(template: string): string[] {
  const regex = /{{(\w+)}}/g;
  const matches = template.matchAll(regex);
  return Array.from(matches).map(m => m[1]);
}
