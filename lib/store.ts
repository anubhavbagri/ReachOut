/**
 * Zustand — UI State Only
 * API keys live in env vars. Persistent data lives in Supabase.
 * Zustand is used for session-level UI state + persisted user preferences.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SearchState, Prospect, ComposeState, ToastNotification, EmailListEntry, SentEmail } from './types';
import { DEFAULT_PERSON_TITLES } from './api-clients';

interface UIPreferences {
  personTitles: string[];
  emailDelayMs: number;
  senderName: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  resumeAttachment?: {
    filename: string;
    content: string; // base64
    contentType: string;
  };
}

interface ReachOutStore {
  // Preferences (persisted in localStorage — safe, not secrets)
  prefs: UIPreferences;
  setPrefs: (p: Partial<UIPreferences>) => void;

  // Gmail auth state — session cache only (source of truth: Supabase app_config)
  gmailUserEmail: string;
  gmailConnected: boolean;
  setGmailState: (email: string, connected: boolean) => void;

  // Search
  search: SearchState;
  setSearchResults: (results: Prospect[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setSearchError: (error?: string) => void;
  updateProspectEmail: (id: string, email: string) => void;

  // Email list (transient — who to send to this session)
  emailList: EmailListEntry[];
  addToEmailList: (entry: EmailListEntry) => void;
  removeFromEmailList: (id: string) => void;
  clearEmailList: () => void;
  isInEmailList: (id: string) => boolean;

  // Compose
  compose: ComposeState;
  setComposeLoading: (v: boolean) => void;
  setComposeProgress: (c: number, t: number) => void;
  resetCompose: () => void;

  // Toasts
  toasts: ToastNotification[];
  addToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning', persistent?: boolean) => void;
  removeToast: (id: string) => void;

  // Sent emails cache (loaded from Supabase on follow-ups page)
  sentEmailsCache: SentEmail[];
  setSentEmailsCache: (emails: SentEmail[]) => void;
  updateSentEmailCache: (id: string, updates: Partial<SentEmail>) => void;
  addSentEmailToCache: (email: SentEmail) => void;
}

export const useStore = create<ReachOutStore>()(
  persist(
    (set, get) => ({
      // ── Preferences ───────────────────────────────────────────────────────
      prefs: {
        personTitles: DEFAULT_PERSON_TITLES,
        emailDelayMs: 1500,
        senderName: '',
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: '',
        resumeUrl: '',
      },
      setPrefs: (p) => set(s => ({ prefs: { ...s.prefs, ...p } })),

      // ── Gmail ─────────────────────────────────────────────────────────────
      gmailUserEmail: '',
      gmailConnected: false,
      setGmailState: (email, connected) => set({ gmailUserEmail: email, gmailConnected: connected }),

      // ── Search ────────────────────────────────────────────────────────────
      search: {
        query: { websiteUrl: '', personTitles: DEFAULT_PERSON_TITLES },
        results: [],
        loading: false,
        totalCount: 0,
        hasMore: false,
      },
      setSearchResults: (results) =>
        set(s => ({ search: { ...s.search, results, totalCount: results.length } })),
      setSearchLoading: (loading) =>
        set(s => ({ search: { ...s.search, loading } })),
      setSearchError: (error) =>
        set(s => ({ search: { ...s.search, error } })),
      updateProspectEmail: (id, email) =>
        set(s => ({
          search: {
            ...s.search,
            results: s.search.results.map(p => p.id === id ? { ...p, email } : p),
          },
        })),

      // ── Email list ────────────────────────────────────────────────────────
      emailList: [],
      addToEmailList: (entry) =>
        set(s => s.emailList.some(e => e.prospectId === entry.prospectId)
          ? {}
          : { emailList: [...s.emailList, entry] }),
      removeFromEmailList: (id) =>
        set(s => ({ emailList: s.emailList.filter(e => e.prospectId !== id) })),
      clearEmailList: () => set({ emailList: [] }),
      isInEmailList: (id) => get().emailList.some(e => e.prospectId === id),

      // ── Compose ───────────────────────────────────────────────────────────
      compose: {
        prospectIds: [], subject: '', body: '', tone: 'professional',
        loading: false, progress: { current: 0, total: 0 },
      },
      setComposeLoading: (loading) =>
        set(s => ({ compose: { ...s.compose, loading } })),
      setComposeProgress: (current, total) =>
        set(s => ({ compose: { ...s.compose, progress: { current, total } } })),
      resetCompose: () =>
        set({ compose: { prospectIds: [], subject: '', body: '', tone: 'professional', loading: false, progress: { current: 0, total: 0 } } }),

      // ── Toasts ────────────────────────────────────────────────────────────
      toasts: [],
      addToast: (msg, type = 'info', persistent = false) => {
        const id = Math.random().toString(36).slice(2);
        set(s => ({ toasts: [...s.toasts, { id, message: msg, type }] }));
        if (!persistent) {
          setTimeout(() => get().removeToast(id), 3500);
        }
      },
      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

      // ── Sent emails cache ─────────────────────────────────────────────────
      sentEmailsCache: [],
      setSentEmailsCache: (emails) => set({ sentEmailsCache: emails }),
      updateSentEmailCache: (id, updates) =>
        set(s => ({
          sentEmailsCache: s.sentEmailsCache.map(e => e.id === id ? { ...e, ...updates } : e),
        })),
      addSentEmailToCache: (email) =>
        set(s => ({ sentEmailsCache: [email, ...s.sentEmailsCache] })),
    }),
    {
      name: 'reachout-v3',
      partialize: (s) => ({
        prefs: s.prefs,
        gmailUserEmail: s.gmailUserEmail,
        gmailConnected: s.gmailConnected,
      }),
    }
  )
);
