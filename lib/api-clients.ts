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
  last_name?: string;              // full last name (old endpoint)
  last_name_obfuscated?: string;   // truncated e.g. "B..." (new endpoint)
  name?: string;
  title?: string;
  email?: string;
  linkedin_url?: string;           // not returned by mixed_people/api_search
  has_email?: boolean;
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

// removed contact_email_status to fetch all results

/**
 * POST /api/v1/mixed_people/api_search — search by company domain
 * (Replaces deprecated /v1/people/search)
 * API key goes in the header as X-Api-Key
 */
export async function apolloSearchByDomain(
  domain: string,
  apiKey: string,
  personTitles: string[] = DEFAULT_PERSON_TITLES,
  perPage = 25
): Promise<Prospect[]> {
  const response = await axios.post<ApolloSearchResponse>(
    'https://api.apollo.io/api/v1/mixed_people/api_search',
    {
      q_organization_domains_list: [domain],
      person_titles: personTitles,
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

  return people.map((p): Prospect => {
    const firstName = p.first_name || '';
    const lastName = p.last_name || p.last_name_obfuscated || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const company = p.organization?.name || domain;

    return {
      id: p.id,
      firstName,
      lastName,
      email: undefined, // revealed separately
      company,
      title: p.title || '',
      linkedin: undefined, // removed fake linkedin URL as requested
      website: p.organization?.website_url || `https://${domain}`,
      location: [p.city, p.state, p.country].filter(Boolean).join(', ') || undefined,
      industry: p.organization?.industry,
      score: 85,
      source: 'apollo',
      createdAt: new Date(),
    };
  });
}

// ─── Apollo People Enrichment (reveal email) ─────────────────────────────────

export interface ApolloEnrichResponse {
  person: {
    id: string;
    email?: string;
    email_status?: string;
    [key: string]: unknown; // Allow any other fields to be returned in details
  };
}

/**
 * POST /v1/people/match — enrich person to get email
 * Passing the Apollo person ID reveals their email
 */
export async function apolloRevealEmail(
  prospectId: string,
  apiKey: string
): Promise<{ email: string | null; details: Record<string, unknown> | null }> {
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

  return {
    email: response.data.person?.email || null,
    details: response.data.person || null
  };
}

// ─── Hunter Email Finder ─────────────────────────────────────────────────────

export interface HunterEmailFinderResponse {
  data: {
    email: string | null;
    score: number;
    position?: string | null;
    first_name?: string;
    last_name?: string;
    domain?: string;
    company?: string;
    linkedin_url?: string | null;
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
): Promise<HunterEmailFinderResponse['data'] | null> {
  const params = new URLSearchParams({
    domain,
    first_name: firstName,
    last_name: lastName,
    api_key: apiKey,
  });

  try {
    const response = await axios.get<HunterEmailFinderResponse>(
      `https://api.hunter.io/v2/email-finder?${params.toString()}`
    );
    console.log('Hunter API Success response:', response.data);
    return response.data?.data || null;
  } catch (error: any) {
    console.error(
      'Hunter API Error Status:',
      error.response?.status,
      'Response:',
      JSON.stringify(error.response?.data) || error.message
    );
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// ─── ContactOut Contact Info ─────────────────────────────────────────────────

export interface ContactOutResponse {
  profile?: {
    first_name?: string;
    last_name?: string;
    title?: string;
    company?: string;
    emails?: Array<{ email: string; type?: string }> | string[];
    work_email?: string;
    personal_email?: string;
    [key: string]: unknown;
  };
}

/**
 * GET /api/v2/contact/info — get contact info by LinkedIn URL
 * Authorization: Token <apiKey>
 */
export async function contactOutFindEmail(
  linkedinUrl: string,
  apiKey: string
): Promise<{ email: string | null; profile: Record<string, unknown> | null }> {
  // Normalize LinkedIn URL
  const url = linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`;

  const response = await axios.get<ContactOutResponse>(
    'https://api.contactout.com/v1/linkedin/enrich',
    {
      params: { profile: url },
      headers: {
        'token': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('ContactOut API Raw Response:', JSON.stringify(response.data, null, 2));

  const profile = response.data?.profile;
  if (!profile) return { email: null, profile: null };

  let email = profile.work_email || profile.personal_email;
  if (!email && profile.emails && profile.emails.length > 0) {
    const first = profile.emails[0];
    email = typeof first === 'string' ? first : (first as { email: string }).email;
  }

  return { email: email || null, profile };
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
