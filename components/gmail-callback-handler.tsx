'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';

/**
 * Handles Gmail OAuth callback in a separate component
 * This is wrapped in Suspense to avoid build-time errors with useSearchParams
 */
export function GmailCallbackHandler() {
  const searchParams = useSearchParams();
  const setGmailAuth = useStore(state => state.setGmailAuth);
  const addToast = useStore(state => state.addToast);

  useEffect(() => {
    const gmailConnected = searchParams.get('gmail');
    const email = searchParams.get('email');

    if (gmailConnected === 'connected' && email) {
      setGmailAuth({
        isAuthenticated: true,
        userEmail: decodeURIComponent(email),
      });
      addToast(`Gmail connected as ${decodeURIComponent(email)}`, 'success');

      // Clean up URL
      window.history.replaceState({}, '', '/app/settings');
    }
  }, [searchParams, setGmailAuth, addToast]);

  return null;
}
