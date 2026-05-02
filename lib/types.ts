/**
 * ReachOut Type Definitions
 * Core types for prospect research, email generation, and Gmail integration
 */

export interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  linkedin?: string;
  website?: string;
  location?: string;
  industry?: string;
  score: number; // Relevance score 0-100
  source: 'apollo' | 'hunter' | 'manual';
  createdAt: Date;
  notes?: string;
}

export interface SearchQuery {
  keywords: string[];
  title?: string;
  company?: string;
  location?: string;
  limit?: number;
}

export interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  variables: string[]; // e.g., ['firstName', 'company', 'personalDetail']
  tone: 'professional' | 'friendly' | 'casual';
}

export interface GeneratedEmail {
  prospectId: string;
  prospectName: string;
  prospectEmail: string;
  subject: string;
  body: string;
  generatedAt: Date;
  status: 'draft' | 'pending' | 'sent' | 'bounced';
}

export interface BulkEmailRequest {
  prospectIds: string[];
  templateId: string;
  subject: string;
  body: string;
  sendAt?: Date;
  delayMs?: number; // Rate limiting delay between sends
}

export interface ApolloResponse {
  people: ApolloProspect[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
  };
}

export interface ApolloProspect {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  company_name: string;
  company_website?: string;
  linkedin_url?: string;
  location: string;
  industry?: string;
}

export interface HunterResponse {
  data: HunterProspect[];
  meta: {
    results: number;
    limit: number;
    offset: number;
  };
}

export interface HunterProspect {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  company: {
    name: string;
    website?: string;
    linkedin_url?: string;
  };
  location?: string;
}

export interface AIProviderConfig {
  name: 'openai' | 'google';
  apiKey?: string;
  modelId: string;
}

export interface GmailAuthState {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  isAuthenticated: boolean;
  userEmail?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
}

export interface AppSettings {
  apolloApiKey?: string;
  hunterApiKey?: string;
  openaiApiKey?: string;
  googleApiKey?: string;
  demoMode: boolean;
  defaultAIProvider: 'openai' | 'google';
  emailDelayMs: number; // Default rate limiting
}

export interface SearchState {
  query: SearchQuery;
  results: Prospect[];
  loading: boolean;
  error?: string;
  totalCount: number;
  hasMore: boolean;
}

export interface ComposeState {
  prospectIds: string[];
  subject: string;
  body: string;
  tone: 'professional' | 'friendly' | 'casual';
  loading: boolean;
  error?: string;
  progress: {
    current: number;
    total: number;
  };
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}
