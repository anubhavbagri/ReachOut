/**
 * Zustand Global State Management
 * Manages search results, compose state, settings, and notifications
 */

import { create } from 'zustand';
import {
  SearchState,
  Prospect,
  ComposeState,
  AppSettings,
  ToastNotification,
  GmailAuthState,
} from './types';

interface ReachOutStore {
  // Search state
  search: SearchState;
  setSearchQuery: (keywords: string[], title?: string, company?: string) => void;
  setSearchResults: (results: Prospect[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setSearchError: (error?: string) => void;
  addSearchResults: (results: Prospect[]) => void;

  // Prospects selection
  selectedProspects: Set<string>;
  toggleProspectSelection: (id: string) => void;
  selectAllProspects: () => void;
  clearSelection: () => void;
  getSelectedProspectsData: () => Prospect[];

  // Compose state
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
  toggleDemoMode: () => void;

  // Gmail auth
  gmailAuth: GmailAuthState;
  setGmailAuth: (auth: Partial<GmailAuthState>) => void;

  // Notifications (toasts)
  toasts: ToastNotification[];
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  removeToast: (id: string) => void;

  // Prospect cache
  allProspects: Map<string, Prospect>;
  addProspects: (prospects: Prospect[]) => void;
  getProspect: (id: string) => Prospect | undefined;
}

export const useStore = create<ReachOutStore>((set, get) => ({
  // Search state
  search: {
    query: { keywords: [] },
    results: [],
    loading: false,
    totalCount: 0,
    hasMore: false,
  },

  setSearchQuery: (keywords, title, company) =>
    set(state => ({
      search: {
        ...state.search,
        query: { keywords, title, company, limit: 20 },
      },
    })),

  setSearchResults: (results) =>
    set(state => ({
      search: {
        ...state.search,
        results,
        totalCount: results.length,
      },
    })),

  setSearchLoading: (loading) =>
    set(state => ({
      search: { ...state.search, loading },
    })),

  setSearchError: (error) =>
    set(state => ({
      search: { ...state.search, error },
    })),

  addSearchResults: (results) =>
    set(state => ({
      search: {
        ...state.search,
        results: [...state.search.results, ...results],
        totalCount: state.search.results.length + results.length,
      },
    })),

  // Prospects selection
  selectedProspects: new Set(),

  toggleProspectSelection: (id) =>
    set(state => {
      const selected = new Set(state.selectedProspects);
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
      return { selectedProspects: selected };
    }),

  selectAllProspects: () =>
    set(state => ({
      selectedProspects: new Set(state.search.results.map(p => p.id)),
    })),

  clearSelection: () =>
    set({ selectedProspects: new Set() }),

  getSelectedProspectsData: () => {
    const state = get();
    return state.search.results.filter(p =>
      state.selectedProspects.has(p.id)
    );
  },

  // Compose state
  compose: {
    prospectIds: [],
    subject: '',
    body: '',
    tone: 'professional',
    loading: false,
    progress: { current: 0, total: 0 },
  },

  setComposeSubject: (subject) =>
    set(state => ({
      compose: { ...state.compose, subject },
    })),

  setComposeBody: (body) =>
    set(state => ({
      compose: { ...state.compose, body },
    })),

  setComposeTone: (tone) =>
    set(state => ({
      compose: { ...state.compose, tone },
    })),

  setComposeLoading: (loading) =>
    set(state => ({
      compose: { ...state.compose, loading },
    })),

  setComposeError: (error) =>
    set(state => ({
      compose: { ...state.compose, error },
    })),

  setComposeProgress: (current, total) =>
    set(state => ({
      compose: {
        ...state.compose,
        progress: { current, total },
      },
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

  // Settings
  settings: {
    demoMode: true,
    defaultAIProvider: 'openai',
    emailDelayMs: 1000,
  },

  setSettings: (newSettings) =>
    set(state => ({
      settings: { ...state.settings, ...newSettings },
    })),

  toggleDemoMode: () =>
    set(state => ({
      settings: { ...state.settings, demoMode: !state.settings.demoMode },
    })),

  // Gmail auth
  gmailAuth: {
    isAuthenticated: false,
  },

  setGmailAuth: (auth) =>
    set(state => ({
      gmailAuth: { ...state.gmailAuth, ...auth },
    })),

  // Notifications
  toasts: [],

  addToast: (message, type = 'info', duration = 3000) =>
    set(state => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: ToastNotification = { id, message, type };
      
      if (duration) {
        setTimeout(() => get().removeToast(id), duration);
      }

      return { toasts: [...state.toasts, newToast] };
    }),

  removeToast: (id) =>
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    })),

  // Prospect cache
  allProspects: new Map(),

  addProspects: (prospects) =>
    set(state => {
      const cache = new Map(state.allProspects);
      prospects.forEach(p => cache.set(p.id, p));
      return { allProspects: cache };
    }),

  getProspect: (id) => {
    const state = get();
    return state.allProspects.get(id);
  },
}));
