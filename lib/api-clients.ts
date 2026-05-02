/**
 * API Client Initialization
 * Handles Apollo, Hunter, and fallback configurations
 */

import axios from 'axios';
import { ApolloResponse, HunterResponse, SearchQuery, Prospect } from './types';

const DEMO_PROSPECTS: Prospect[] = [
  {
    id: 'demo-1',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@techcorp.com',
    company: 'TechCorp',
    title: 'VP of Product',
    linkedin: 'linkedin.com/in/sarahchen',
    website: 'techcorp.com',
    location: 'San Francisco, CA',
    industry: 'Technology',
    score: 92,
    source: 'apollo',
    createdAt: new Date(),
    notes: 'Active in SaaS community, writes on product strategy',
  },
  {
    id: 'demo-2',
    firstName: 'Marcus',
    lastName: 'Rodriguez',
    email: 'marcus.r@innovateLabs.io',
    company: 'Innovate Labs',
    title: 'Founder & CEO',
    linkedin: 'linkedin.com/in/mrodriguez',
    website: 'innovatelabs.io',
    location: 'Austin, TX',
    industry: 'Technology',
    score: 88,
    source: 'hunter',
    createdAt: new Date(),
    notes: 'Early stage funded, looking for partnerships',
  },
  {
    id: 'demo-3',
    firstName: 'Jennifer',
    lastName: 'Park',
    email: 'jpark@enterprises.com',
    company: 'Global Enterprises Inc',
    title: 'Chief Technology Officer',
    linkedin: 'linkedin.com/in/jenniferpark',
    website: 'enterprises.com',
    location: 'New York, NY',
    industry: 'Enterprise Software',
    score: 85,
    source: 'apollo',
    createdAt: new Date(),
    notes: 'Known for modernizing legacy systems',
  },
];

export class ApolloClient {
  private apiKey: string;
  private baseUrl = 'https://api.apollo.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchProspects(query: SearchQuery): Promise<Prospect[]> {
    try {
      const response = await axios.post<ApolloResponse>(
        `${this.baseUrl}/mixed_people/search`,
        {
          q_keywords: query.keywords.join(' '),
          person_title: query.title,
          organization_name: query.company,
          person_locations: query.location ? [query.location] : [],
          limit: query.limit || 10,
        },
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            'X-Api-Key': this.apiKey,
          },
        }
      );

      return response.data.people.map(p => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        email: p.email,
        company: p.company_name,
        title: p.title,
        linkedin: p.linkedin_url,
        website: p.company_website,
        location: p.location,
        industry: p.industry,
        score: 85,
        source: 'apollo' as const,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('[v0] Apollo API error:', error);
      throw error;
    }
  }
}

export class HunterClient {
  private apiKey: string;
  private baseUrl = 'https://api.hunter.io/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchProspects(query: SearchQuery): Promise<Prospect[]> {
    try {
      const params = new URLSearchParams({
        domain: query.company || '',
        limit: String(query.limit || 10),
        api_key: this.apiKey,
      });

      const response = await axios.get<HunterResponse>(
        `${this.baseUrl}/domain/search?${params.toString()}`
      );

      return response.data.data.map(p => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        email: p.email,
        company: p.company.name,
        title: p.position,
        linkedin: undefined,
        website: p.company.website,
        location: p.location,
        score: 80,
        source: 'hunter' as const,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('[v0] Hunter API error:', error);
      throw error;
    }
  }
}

/**
 * Fallback search using demo data
 * Used when API credentials aren't available or requests fail
 */
export async function demoSearch(query: SearchQuery): Promise<Prospect[]> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 300));

  const keywords = query.keywords.map(k => k.toLowerCase());
  const title = query.title?.toLowerCase();
  const company = query.company?.toLowerCase();

  return DEMO_PROSPECTS.filter(p => {
    const matchesKeywords = keywords.some(
      k =>
        p.firstName.toLowerCase().includes(k) ||
        p.lastName.toLowerCase().includes(k) ||
        p.company.toLowerCase().includes(k) ||
        p.title.toLowerCase().includes(k)
    );

    const matchesTitle = !title || p.title.toLowerCase().includes(title);
    const matchesCompany =
      !company || p.company.toLowerCase().includes(company);

    return matchesKeywords && matchesTitle && matchesCompany;
  });
}

/**
 * Intelligent fallback chain for prospect search
 * 1. Try Apollo (best coverage)
 * 2. Try Hunter (email focus)
 * 3. Fall back to demo data
 */
export async function searchProspectsWithFallback(
  query: SearchQuery,
  apolloKey?: string,
  hunterKey?: string
): Promise<Prospect[]> {
  // Try Apollo first
  if (apolloKey) {
    try {
      const apollo = new ApolloClient(apolloKey);
      return await apollo.searchProspects(query);
    } catch (error) {
      console.warn('[v0] Apollo search failed, trying Hunter...');
    }
  }

  // Try Hunter
  if (hunterKey && query.company) {
    try {
      const hunter = new HunterClient(hunterKey);
      return await hunter.searchProspects(query);
    } catch (error) {
      console.warn('[v0] Hunter search failed, using demo data...');
    }
  }

  // Fall back to demo
  return demoSearch(query);
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize prospect data
 */
export function sanitizeProspect(prospect: Partial<Prospect>): Prospect {
  return {
    id: prospect.id || '',
    firstName: (prospect.firstName || '').trim(),
    lastName: (prospect.lastName || '').trim(),
    email: (prospect.email || '').toLowerCase().trim(),
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
