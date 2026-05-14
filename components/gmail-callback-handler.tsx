'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

/**
 * Reads the ?gmail=connected&email=... params after OAuth redirect.
 * Token is already saved to Supabase by the server-side route.
 * This just updates the local Zustand UI state and cleans the URL.
 */
export function GmailCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setGmailState = useStore(s => s.setGmailState);
  const addToast = useStore(s => s.addToast);

  useEffect(() => {
    const gmailStatus = searchParams.get('gmail');
    const userEmail = searchParams.get('email');
    const reason = searchParams.get('reason');

    if (gmailStatus === 'connected' && userEmail) {
      // Token already in Supabase — just update local UI state
      setGmailState(userEmail, true);
      addToast(`Gmail connected: ${userEmail}`, 'success');
      router.replace('/app/settings');
      return;
    }

    if (gmailStatus === 'error') {
      const msg = reason ? decodeURIComponent(reason) : 'Unknown error';
      addToast(`Gmail connection failed: ${msg}`, 'error');
      router.replace('/app/settings');
    }
  }, [searchParams, router, setGmailState, addToast]);

  return null;
}
