/**
 * API Clients
 * Apollo (API key header auth), Hunter, ContactOut
 */

import axios from 'axios';
import { Prospect } from './types';

// ─── Helpers ────────────────────────────────────────────────────────────────

export function normalizeDomain(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .toLowerCase();
}

export function isValidDomain(input: string): boolean {
  const domain = normalizeDomain(input);
  // Must contain at least one dot and no spaces
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(domain);
}

// ─── Apollo People Search ────────────────────────────────────────────────────

export interface ApolloPersonRaw {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  title?: string;
  email?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
  organization?: {
    id?: string;
    name?: string;
    website_url?: string;
    primary_domain?: string;
    industry?: string;
  };
}

export interface ApolloSearchResponse {
  people: ApolloPersonRaw[];
  contacts?: ApolloPersonRaw[];
  pagination?: {
    page: number;
    per_page: number;
    total_entries: number;
  };
}

export const DEFAULT_PERSON_TITLES = [
  'recruiter',
  'talent',
  'people',
  'culture',
  'hiring',
  'HR',
  'talent acquisition specialist',
  'tech recruiter',
  'talent acquisition',
];

// contact_email_status values — hardcoded, not shown in UI
const CONTACT_EMAIL_STATUSES = ['verified', 'unverified', 'user managed', 'update required'];

/**
 * POST /v1/people/search — search by company domain
 * API key goes in the header as X-Api-Key
 */
export async function apolloSearchByDomain(
  domain: string,
  apiKey: string,
  personTitles: string[] = DEFAULT_PERSON_TITLES,
  perPage = 25
): Promise<Prospect[]> {
  const response = await axios.post<ApolloSearchResponse>(
    'https://api.apollo.io/v1/people/search',
    {
      q_organization_domains_list: [domain],
      person_titles: personTitles,
      contact_email_status: CONTACT_EMAIL_STATUSES,
      per_page: perPage,
      page: 1,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey,
      },
    }
  );

  const people = response.data.people || response.data.contacts || [];

  return people.map((p): Prospect => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    email: undefined, // revealed separately
    company: p.organization?.name || domain,
    title: p.title || '',
    linkedin: p.linkedin_url,
    website: p.organization?.website_url || `https://${domain}`,
    location: [p.city, p.state, p.country].filter(Boolean).join(', ') || undefined,
    industry: p.organization?.industry,
    score: 85,
    source: 'apollo',
    createdAt: new Date(),
  }));
}

// ─── Apollo People Enrichment (reveal email) ─────────────────────────────────

export interface ApolloEnrichResponse {
  person: {
    id: string;
    email?: string;
    email_status?: string;
  };
}

/**
 * POST /v1/people/match — enrich person to get email
 * Passing the Apollo person ID reveals their email
 */
export async function apolloRevealEmail(
  prospectId: string,
  apiKey: string
): Promise<string | null> {
  const response = await axios.post<ApolloEnrichResponse>(
    'https://api.apollo.io/v1/people/match',
    {
      id: prospectId,
      reveal_personal_emails: true,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
    }
  );
  return response.data?.person?.email || null;
}

// ─── Hunter Email Finder ─────────────────────────────────────────────────────

export interface HunterEmailFinderResponse {
  data: {
    email: string | null;
    score: number;
    position?: string;
    first_name?: string;
    last_name?: string;
    sources?: Array<{ domain: string; uri: string }>;
  };
}

/**
 * GET /v2/email-finder — find a specific person's email by name + domain
 */
export async function hunterFindEmail(
  firstName: string,
  lastName: string,
  domain: string,
  apiKey: string
): Promise<string | null> {
  const params = new URLSearchParams({
    domain,
    first_name: firstName,
    last_name: lastName,
    api_key: apiKey,
  });
  const response = await axios.get<HunterEmailFinderResponse>(
    `https://api.hunter.io/v2/email-finder?${params.toString()}`
  );
  return response.data?.data?.email || null;
}

// ─── ContactOut Contact Info ─────────────────────────────────────────────────

export interface ContactOutResponse {
  profile?: {
    emails?: Array<{ email: string; type?: string }> | string[];
    work_email?: string;
    personal_email?: string;
  };
}

/**
 * GET /api/v2/contact/info — get contact info by LinkedIn URL
 * Authorization: Token <apiKey>
 */
export async function contactOutFindEmail(
  linkedinUrl: string,
  apiKey: string
): Promise<string | null> {
  // Normalize LinkedIn URL
  const url = linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`;

  const response = await axios.get<ContactOutResponse>(
    'https://api.contactout.com/v2/contact/info',
    {
      params: { linkedin: url },
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const profile = response.data?.profile;
  if (!profile) return null;

  // Prefer work email, then first email in array
  if (profile.work_email) return profile.work_email;
  if (profile.personal_email) return profile.personal_email;

  const emails = profile.emails;
  if (!emails || emails.length === 0) return null;

  const first = emails[0];
  if (typeof first === 'string') return first;
  return (first as { email: string }).email || null;
}

// ─── Sanitize ────────────────────────────────────────────────────────────────

export function sanitizeProspect(prospect: Partial<Prospect>): Prospect {
  return {
    id: prospect.id || '',
    firstName: (prospect.firstName || '').trim(),
    lastName: (prospect.lastName || '').trim(),
    email: prospect.email ? prospect.email.toLowerCase().trim() : undefined,
    company: (prospect.company || '').trim(),
    title: (prospect.title || '').trim(),
    linkedin: prospect.linkedin?.trim(),
    website: prospect.website?.trim(),
    location: prospect.location?.trim(),
    industry: prospect.industry?.trim(),
    score: prospect.score || 0,
    source: prospect.source || 'manual',
    createdAt: prospect.createdAt || new Date(),
    notes: prospect.notes?.trim(),
  };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
