'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ManualSendForm, ManualContact } from '@/components/manual-send-form';
import { EmailPreview } from '@/components/email-preview';
import { EmailBulkSender } from '@/components/email-bulk-sender';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { X, Wand2 } from 'lucide-react';

type Tab = 'build' | 'review' | 'send';

const PAGE_SESSION_KEY = 'reachout_manual_page_state';
const FORM_SESSION_KEY = 'reachout_manual_form_state';

export default function SendPage() {
  const router = useRouter();
  const addToast = useStore(state => state.addToast);

  const [tab, setTab] = useState<Tab>('build');
  const [emails, setEmails] = useState<any[]>([]);

  // Contacts lifted to page level for cross-tab visibility
  const [contacts, setContacts] = useState<ManualContact[]>([]);

  // Sync contacts from form's sessionStorage on mount + after any change
  const syncContacts = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(FORM_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.contacts) setContacts(parsed.contacts);
      }
    } catch { /* ignore */ }
  }, []);

  // Hydrate on mount
  useEffect(() => {
    syncContacts();
    try {
      const saved = sessionStorage.getItem(PAGE_SESSION_KEY);
      if (saved) {
        const { emails: savedEmails, tab: savedTab } = JSON.parse(saved);
        if (savedEmails?.length) {
          setEmails(savedEmails);
          if (savedTab) setTab(savedTab as Tab);
        }
      }
    } catch { /* ignore */ }
  }, [syncContacts]);

  // Keep contacts in sync when tab changes (form may have updated them)
  useEffect(() => { syncContacts(); }, [tab, syncContacts]);

  // Persist page state
  useEffect(() => {
    try {
      sessionStorage.setItem(PAGE_SESSION_KEY, JSON.stringify({ emails, tab }));
    } catch { /* ignore */ }
  }, [emails, tab]);

  // Keep generated emails in sync whenever contacts change
  // (e.g. contact removed from panel → its generated email should be purged)
  useEffect(() => {
    if (emails.length === 0) return;
    const contactIds = new Set(contacts.map(c => c.id));
    const filtered = emails.filter(e => contactIds.has(e.prospectId));
    if (filtered.length !== emails.length) {
      setEmails(filtered);
      if (filtered.length === 0 && tab !== 'build') {
        setTab('build');
      }
    }
  }, [contacts]); // intentionally only depends on contacts

  const handleEmailsReady = (generated: any[]) => {
    setEmails(generated);
    setTab('review');
    syncContacts();
  };

  const toggleRecipientType = (id: string) => {
    setContacts(prev => prev.map(c =>
      c.id === id ? { ...c, recipientType: c.recipientType === 'HR' ? 'HM' : 'HR' } : c
    ));
    // Write back to sessionStorage so form stays in sync
    try {
      const saved = sessionStorage.getItem(FORM_SESSION_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      const updated = (parsed.contacts || []).map((c: ManualContact) =>
        c.id === id ? { ...c, recipientType: c.recipientType === 'HR' ? 'HM' : 'HR' } : c
      );
      sessionStorage.setItem(FORM_SESSION_KEY, JSON.stringify({ ...parsed, contacts: updated }));
      window.dispatchEvent(new Event('contacts-updated'));
    } catch { /* ignore */ }
  };

  const removeContact = (id: string) => {
    const next = contacts.filter(c => c.id !== id);
    setContacts(next);
    
    // Keep generated emails in sync
    const nextEmails = emails.filter(e => e.prospectId !== id);
    setEmails(nextEmails);
    if (nextEmails.length === 0 && tab !== 'build') {
      setTab('build');
    }

    try {
      const saved = sessionStorage.getItem(FORM_SESSION_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      sessionStorage.setItem(FORM_SESSION_KEY, JSON.stringify({ ...parsed, contacts: next }));
      window.dispatchEvent(new Event('contacts-updated'));
    } catch { /* ignore */ }
  };

  const clearContacts = () => {
    setContacts([]);
    setEmails([]);
    setTab('build');
    try {
      const saved = sessionStorage.getItem(FORM_SESSION_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      sessionStorage.setItem(FORM_SESSION_KEY, JSON.stringify({ ...parsed, contacts: [] }));
      window.dispatchEvent(new Event('contacts-updated'));
    } catch { /* ignore */ }
  };

  return (
    <Tabs value={tab} onValueChange={v => setTab(v as Tab)} className="flex flex-col h-full">

      {/* ── Page header with tabs on the right ─────────────────── */}
      <div className="border-b border-border bg-card/50 px-4 md:px-6 py-4 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Send</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Add contacts, compose, review, and send — all in one place.
          </p>
        </div>
        {/* Tabs moved to header top-right */}
        <TabsList className="grid grid-cols-3 h-9 w-auto min-w-[220px]">
          <TabsTrigger value="build" className="text-xs">Build</TabsTrigger>
          <TabsTrigger value="review" disabled={emails.length === 0} className="text-xs">
            Review
          </TabsTrigger>
          <TabsTrigger value="send" disabled={emails.length === 0} className="text-xs">Send</TabsTrigger>
        </TabsList>
      </div>

      {/* ── Main content area ───────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">

        {/* Left: tab content — exactly half of the screen on desktop */}
        <div className="flex-1 basis-1/2 p-4 md:p-6 min-w-0">
          <TabsContent value="build" className="mt-0">
            <ManualSendForm onEmailsReady={handleEmailsReady} onContactsChange={syncContacts} />
          </TabsContent>

          <TabsContent value="review" className="mt-0">
            {emails.length > 0 && (
              <EmailPreview
                emails={emails}
                onEmailsChange={setEmails}
              />
            )}
          </TabsContent>

          <TabsContent value="send" className="mt-0">
            {emails.length > 0 && (
              <EmailBulkSender
                emails={emails}
                onComplete={() => {
                  addToast('Sent! Tracked in Follow-ups.', 'success');
                  router.push('/app/follow-ups');
                }}
              />
            )}
          </TabsContent>
        </div>

        {/* Right: persistent contacts panel — exactly half of the screen on desktop */}
        <aside className="flex-1 basis-1/2 p-4 md:p-6 flex flex-col gap-4 order-first md:order-none min-w-0">
          {/* Contacts card — dynamic height, fills its half */}
          <Card className="p-3 flex flex-col w-full">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Contacts{contacts.length > 0 ? ` (${contacts.length})` : ''}
              </p>
              {contacts.length > 0 && (
                <button
                  onClick={clearContacts}
                  className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Clear all contacts"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {contacts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No contacts added yet.</p>
            ) : (
              <div className="space-y-0.5">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs py-1 px-2 rounded hover:bg-muted group min-w-0">
                    <div className="flex-1 min-w-0 flex items-center gap-1 overflow-hidden">
                      <span className="font-medium shrink-0 max-w-[25%] truncate">{c.firstName} {c.lastName}</span>
                      <span className="text-muted-foreground shrink-0">·</span>
                      <span className="text-muted-foreground truncate min-w-0 flex-1">
                        {c.email}{c.company ? ` · ${c.company}` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRecipientType(c.id)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 transition-colors ${
                        c.recipientType === 'HR'
                          ? 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
                          : 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800'
                      }`}
                    >
                      {c.recipientType}
                    </button>
                    <button
                      onClick={() => removeContact(c.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </Tabs>
  );
}
