/**
 * ReachOut Type Definitions
 */

export interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email?: string; // Revealed via Apollo / Hunter / ContactOut CTAs
  company: string;
  title: string;
  linkedin?: string;
  website?: string;
  location?: string;
  industry?: string;
  score: number;
  source: 'apollo' | 'hunter' | 'contactout' | 'manual';
  createdAt: Date;
  notes?: string;
}

export interface SearchQuery {
  websiteUrl: string;
  personTitles?: string[];
  limit?: number;
}

export interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  variables: string[];
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

export interface AppSettings {
  apolloApiKey?: string;
  hunterApiKey?: string;
  contactOutApiKey?: string;
  openaiApiKey?: string;
  googleApiKey?: string;
  defaultAIProvider: 'openai' | 'google';
  emailDelayMs: number;
  personTitles: string[]; // Editable list shown in search form
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

// Follow-up tracking
export interface SentEmail {
  id: string;
  prospectId: string;
  prospectName: string;
  prospectEmail: string;
  prospectCompany: string;
  prospectTitle: string;
  subject: string;
  body: string;
  sentAt: Date;
  followUpStatus: 'pending' | 'followed_up' | 'replied' | 'not_interested';
  followUpCount: number;
  lastFollowUpAt?: Date;
  notes?: string;
  gmailThreadId?: string;
}

// Email list for bulk sending — prospects whose emails have been revealed
export interface EmailListEntry {
  prospectId: string;
  prospectName: string;
  prospectEmail: string;
  prospectCompany: string;
  prospectTitle: string;
  addedAt: Date;
}
