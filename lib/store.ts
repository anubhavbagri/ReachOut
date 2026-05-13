/**
 * Zustand Global State Management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SearchState,
  Prospect,
  ComposeState,
  AppSettings,
  ToastNotification,
  GmailAuthState,
  SentEmail,
  EmailListEntry,
} from './types';
import { DEFAULT_PERSON_TITLES } from './api-clients';

interface ReachOutStore {
  // Search
  search: SearchState;
  setSearchQuery: (websiteUrl: string, personTitles?: string[]) => void;
  setSearchResults: (results: Prospect[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setSearchError: (error?: string) => void;
  updateProspectEmail: (id: string, email: string) => void;

  // Selection
  selectedProspects: Set<string>;
  toggleProspectSelection: (id: string) => void;
  selectAllProspects: () => void;
  clearSelection: () => void;
  getSelectedProspectsData: () => Prospect[];

  // Compose
  compose: ComposeState;
  setComposeSubject: (subject: string) => void;
  setComposeBody: (body: string) => void;
  setComposeTone: (tone: 'professional' | 'friendly' | 'casual') => void;
  setComposeLoading: (loading: boolean) => void;
  setComposeError: (error?: string) => void;
  setComposeProgress: (current: number, total: number) => void;
  resetCompose: () => void;

  // Settings
  settings: AppSettings;
  setSettings: (settings: Partial<AppSettings>) => void;

  // Gmail
  gmailAuth: GmailAuthState;
  setGmailAuth: (auth: Partial<GmailAuthState>) => void;

  // Toasts
  toasts: ToastNotification[];
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  removeToast: (id: string) => void;

  // Email list (prospects to send bulk emails to)
  emailList: EmailListEntry[];
  addToEmailList: (entry: EmailListEntry) => void;
  removeFromEmailList: (prospectId: string) => void;
  clearEmailList: () => void;
  isInEmailList: (prospectId: string) => boolean;

  // Follow-up tracking
  sentEmails: SentEmail[];
  addSentEmail: (email: SentEmail) => void;
  updateSentEmail: (id: string, updates: Partial<SentEmail>) => void;
  markFollowedUp: (id: string, notes?: string) => void;
}

export const useStore = create<ReachOutStore>()(
  persist(
    (set, get) => ({
      // ── Search ────────────────────────────────────────────────────────────
      search: {
        query: { websiteUrl: '', personTitles: DEFAULT_PERSON_TITLES },
        results: [],
        loading: false,
        totalCount: 0,
        hasMore: false,
      },

      setSearchQuery: (websiteUrl, personTitles) =>
        set(state => ({
          search: {
            ...state.search,
            query: { websiteUrl, personTitles },
          },
        })),

      setSearchResults: (results) =>
        set(state => ({
          search: { ...state.search, results, totalCount: results.length },
        })),

      setSearchLoading: (loading) =>
        set(state => ({ search: { ...state.search, loading } })),

      setSearchError: (error) =>
        set(state => ({ search: { ...state.search, error } })),

      updateProspectEmail: (id, email) =>
        set(state => ({
          search: {
            ...state.search,
            results: state.search.results.map(p =>
              p.id === id ? { ...p, email } : p
            ),
          },
        })),

      // ── Selection ─────────────────────────────────────────────────────────
      selectedProspects: new Set(),

      toggleProspectSelection: (id) =>
        set(state => {
          const selected = new Set(state.selectedProspects);
          selected.has(id) ? selected.delete(id) : selected.add(id);
          return { selectedProspects: selected };
        }),

      selectAllProspects: () =>
        set(state => ({
          selectedProspects: new Set(state.search.results.map(p => p.id)),
        })),

      clearSelection: () => set({ selectedProspects: new Set() }),

      getSelectedProspectsData: () => {
        const state = get();
        return state.search.results.filter(p => state.selectedProspects.has(p.id));
      },

      // ── Compose ───────────────────────────────────────────────────────────
      compose: {
        prospectIds: [],
        subject: '',
        body: '',
        tone: 'professional',
        loading: false,
        progress: { current: 0, total: 0 },
      },

      setComposeSubject: (subject) =>
        set(state => ({ compose: { ...state.compose, subject } })),

      setComposeBody: (body) =>
        set(state => ({ compose: { ...state.compose, body } })),

      setComposeTone: (tone) =>
        set(state => ({ compose: { ...state.compose, tone } })),

      setComposeLoading: (loading) =>
        set(state => ({ compose: { ...state.compose, loading } })),

      setComposeError: (error) =>
        set(state => ({ compose: { ...state.compose, error } })),

      setComposeProgress: (current, total) =>
        set(state => ({
          compose: { ...state.compose, progress: { current, total } },
        })),

      resetCompose: () =>
        set({
          compose: {
            prospectIds: [],
            subject: '',
            body: '',
            tone: 'professional',
            loading: false,
            progress: { current: 0, total: 0 },
          },
        }),

      // ── Settings ──────────────────────────────────────────────────────────
      settings: {
        apolloApiKey: '',
        hunterApiKey: '',
        contactOutApiKey: '',
        openaiApiKey: '',
        googleApiKey: '',
        defaultAIProvider: 'openai',
        emailDelayMs: 1500,
        personTitles: DEFAULT_PERSON_TITLES,
      },

      setSettings: (newSettings) =>
        set(state => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // ── Gmail ─────────────────────────────────────────────────────────────
      gmailAuth: { isAuthenticated: false },

      setGmailAuth: (auth) =>
        set(state => ({ gmailAuth: { ...state.gmailAuth, ...auth } })),

      // ── Toasts ────────────────────────────────────────────────────────────
      toasts: [],

      addToast: (message, type = 'info', duration = 3500) =>
        set(state => {
          const id = Math.random().toString(36).substr(2, 9);
          if (duration) setTimeout(() => get().removeToast(id), duration);
          return { toasts: [...state.toasts, { id, message, type }] };
        }),

      removeToast: (id) =>
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

      // ── Email list ────────────────────────────────────────────────────────
      emailList: [],

      addToEmailList: (entry) =>
        set(state => {
          // Avoid duplicates
          if (state.emailList.some(e => e.prospectId === entry.prospectId)) {
            return {};
          }
          return { emailList: [...state.emailList, entry] };
        }),

      removeFromEmailList: (prospectId) =>
        set(state => ({
          emailList: state.emailList.filter(e => e.prospectId !== prospectId),
        })),

      clearEmailList: () => set({ emailList: [] }),

      isInEmailList: (prospectId) => {
        return get().emailList.some(e => e.prospectId === prospectId);
      },

      // ── Follow-ups ────────────────────────────────────────────────────────
      sentEmails: [],

      addSentEmail: (email) =>
        set(state => ({ sentEmails: [email, ...state.sentEmails] })),

      updateSentEmail: (id, updates) =>
        set(state => ({
          sentEmails: state.sentEmails.map(e =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      markFollowedUp: (id, notes) =>
        set(state => ({
          sentEmails: state.sentEmails.map(e =>
            e.id === id
              ? {
                  ...e,
                  followUpStatus: 'followed_up' as const,
                  followUpCount: e.followUpCount + 1,
                  lastFollowUpAt: new Date(),
                  notes: notes || e.notes,
                }
              : e
          ),
        })),
    }),
    {
      name: 'reachout-v2',
      partialize: (state) => ({
        settings: state.settings,
        gmailAuth: state.gmailAuth,
        sentEmails: state.sentEmails,
        emailList: state.emailList,
      }),
    }
  )
);
