/**
 * AI Email Generation — Google Gemini only
 * The API key is passed explicitly from the user's Settings (stored in localStorage).
 * This allows the key to be configured entirely via the Settings UI — no .env needed.
 */

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { applyTemplate, HR_OUTREACH_TEMPLATE } from '@/lib/email-templates';

export type EmailTone = 'professional' | 'friendly' | 'casual';

export interface ProspectForEmail {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  company: string;
  title?: string;
  location?: string;
  industry?: string;
  website?: string;
}

const SYSTEM_PROMPT = `You are an expert at writing short, genuine cold outreach emails for job seekers reaching out to recruiters and hiring managers. Your emails:
- Open with a specific, non-generic observation about the person or their company
- State the sender's value proposition in 1-2 punchy sentences
- End with a low-pressure, specific CTA (15-min call, coffee chat)
- Keep the subject under 50 characters
- Keep the body under 120 words
- Sound human, warm, and conversational — not salesy or templated
- Never use buzzwords like "synergy", "leverage", "circle back"

You MUST return ONLY a valid JSON object — no markdown fences, no extra text:
{"subject": "...", "body": "..."}`;

function getGeminiModel(apiKey?: string) {
  // Prefer the explicitly passed key (from Settings UI / localStorage).
  // Fall back to server env var (for API routes running on Vercel).
  const key = apiKey
    || process.env.GOOGLE_API_KEY
    || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!key) {
    throw new Error('Gemini API key not configured. Add it in Settings → Google Gemini API Key.');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite-preview-06-17';
  const google = createGoogleGenerativeAI({ apiKey: key });
  return google(model);
}

function parseGeminiJSON(text: string): { subject: string; body: string } {
  let t = text.trim();
  // Strip markdown fences
  const fenced = t.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (fenced) t = fenced[1].trim();
  const parsed = JSON.parse(t);
  return {
    subject: String(parsed.subject || '').trim(),
    body: String(parsed.body || '').trim(),
  };
}

function fallbackEmail(prospect: ProspectForEmail): { subject: string; body: string } {
  return {
    subject: applyTemplate(HR_OUTREACH_TEMPLATE.subject, {
      firstName: prospect.firstName,
      company: prospect.company,
      senderName: '[Your name]',
    }),
    body: applyTemplate(HR_OUTREACH_TEMPLATE.body, {
      firstName: prospect.firstName,
      company: prospect.company,
      senderName: '[Your name]',
    }),
  };
}

// ─── Single email ────────────────────────────────────────────────────────────

export async function generateEmail(
  prospect: ProspectForEmail,
  context: string,
  tone: EmailTone = 'professional',
  geminiApiKey?: string
): Promise<{ subject: string; body: string }> {
  const toneMap = {
    professional: 'Formal and polished, like a senior professional.',
    friendly: 'Warm and personable, like a colleague reaching out.',
    casual: 'Relaxed and conversational, like a peer.',
  };

  const prompt = `Write a personalized cold email to this person:
Name: ${prospect.firstName} ${prospect.lastName}
Title: ${prospect.title || 'Recruiter'}
Company: ${prospect.company}
Location: ${prospect.location || 'Unknown'}
Industry: ${prospect.industry || 'Unknown'}

Context about the sender:
${context}

Tone: ${toneMap[tone]}

Return ONLY valid JSON: {"subject": "...", "body": "..."}`;

  try {
    const result = await generateText({
      model: getGeminiModel(geminiApiKey),
      system: SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 500,
    });
    return parseGeminiJSON(result.text);
  } catch (err) {
    console.error('[ReachOut] Gemini error:', err);
    return fallbackEmail(prospect);
  }
}

// ─── From company domain ─────────────────────────────────────────────────────

export async function generateEmailFromDomain(
  prospect: ProspectForEmail,
  companyDomain: string,
  tone: EmailTone = 'professional',
  geminiApiKey?: string
): Promise<{ subject: string; body: string }> {
  const prompt = `Write a personalized cold email from a job seeker to a recruiter at a company.

Recipient: ${prospect.firstName} ${prospect.lastName} (${prospect.title || 'Recruiter'}) at ${prospect.company}
Company domain: ${companyDomain}

Research what ${prospect.company} (${companyDomain}) does and write a company-specific email that references something real about the company. Keep it under 120 words. Tone: ${tone}.

Return ONLY valid JSON: {"subject": "...", "body": "..."}`;

  try {
    const result = await generateText({
      model: getGeminiModel(geminiApiKey),
      system: SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 500,
    });
    return parseGeminiJSON(result.text);
  } catch {
    return generateEmail(prospect, `Interested in opportunities at ${prospect.company}`, tone, geminiApiKey);
  }
}

// ─── From job description ────────────────────────────────────────────────────

export async function generateEmailFromJobDescription(
  prospect: ProspectForEmail,
  jobDescription: string,
  tone: EmailTone = 'professional',
  geminiApiKey?: string
): Promise<{ subject: string; body: string }> {
  const prompt = `Write a personalized cold email from a job applicant to a recruiter based on this job description.

Recipient: ${prospect.firstName} ${prospect.lastName} (${prospect.title || 'Recruiter'}) at ${prospect.company}

Job Description:
${jobDescription.slice(0, 2000)}

Reference 1-2 specifics from the JD. Keep it under 120 words. Tone: ${tone}.

Return ONLY valid JSON: {"subject": "...", "body": "..."}`;

  try {
    const result = await generateText({
      model: getGeminiModel(geminiApiKey),
      system: SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 500,
    });
    return parseGeminiJSON(result.text);
  } catch {
    return generateEmail(prospect, `Applying for the role described`, tone, geminiApiKey);
  }
}

// ─── Batch ───────────────────────────────────────────────────────────────────

export async function generateEmailsBatch(
  prospects: ProspectForEmail[],
  context: string,
  tone: EmailTone = 'professional',
  onProgress?: (current: number, total: number) => void,
  delayMs = 700,
  geminiApiKey?: string
) {
  const emails = [];

  for (let i = 0; i < prospects.length; i++) {
    try {
      const email = await generateEmail(prospects[i], context, tone, geminiApiKey);
      emails.push({
        prospectId: prospects[i].id,
        prospectName: `${prospects[i].firstName} ${prospects[i].lastName}`,
        prospectEmail: prospects[i].email || '',
        ...email,
        generatedAt: new Date(),
        status: 'draft' as const,
      });
    } catch (err) {
      console.error(`[ReachOut] Failed for ${prospects[i].firstName}:`, err);
    }
    onProgress?.(i + 1, prospects.length);
    if (i < prospects.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return emails;
}

// personalizeEmail and extractTemplateVariables are intentionally removed.
// Use applyTemplate() and getTemplateVariables() from @/lib/email-templates instead.
