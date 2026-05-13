'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';

/**
 * Handles Gmail OAuth callback in a separate component.
 * Wrapped in Suspense to avoid build-time errors with useSearchParams.
 * Reads email + refreshToken from URL params and stores in Zustand (persisted).
 */
export function GmailCallbackHandler() {
  const searchParams = useSearchParams();
  const setGmailAuth = useStore(state => state.setGmailAuth);
  const addToast = useStore(state => state.addToast);

  useEffect(() => {
    const gmailConnected = searchParams.get('gmail');
    const email = searchParams.get('email');
    const refreshToken = searchParams.get('refreshToken');

    if (gmailConnected === 'connected' && email) {
      setGmailAuth({
        isAuthenticated: true,
        userEmail: decodeURIComponent(email),
        refreshToken: refreshToken ? decodeURIComponent(refreshToken) : undefined,
      });
      addToast(`Gmail connected as ${decodeURIComponent(email)}`, 'success');

      // Clean up URL (remove tokens from address bar)
      window.history.replaceState({}, '', '/app/settings');
    }
  }, [searchParams, setGmailAuth, addToast]);

  return null;
}
