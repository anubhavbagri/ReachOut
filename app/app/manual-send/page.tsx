'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ManualSendForm } from '@/components/manual-send-form';
import { EmailPreview } from '@/components/email-preview';
import { EmailBulkSender } from '@/components/email-bulk-sender';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Tab = 'build' | 'review' | 'send';

export default function ManualSendPage() {
  const router = useRouter();
  const addToast = useStore(state => state.addToast);
  const addSentEmail = useStore(state => state.addSentEmail);

  const [tab, setTab] = useState<Tab>('build');
  const [emails, setEmails] = useState<any[]>([]);

  const handleEmailsReady = (generated: any[]) => {
    setEmails(generated);
    setTab('review');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card/50 p-4 md:p-6 shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold">Manual Send</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste a contact list and send bulk emails — no Apollo search required
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <Tabs value={tab} onValueChange={v => setTab(v as Tab)}>
          <TabsList className="grid w-full max-w-xs grid-cols-3 h-9 mb-6">
            <TabsTrigger value="build" className="text-xs">Build</TabsTrigger>
            <TabsTrigger value="review" disabled={emails.length === 0} className="text-xs">
              Review{emails.length > 0 ? ` (${emails.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="send" disabled={emails.length === 0} className="text-xs">
              Send
            </TabsTrigger>
          </TabsList>

          <TabsContent value="build">
            <ManualSendForm onEmailsReady={handleEmailsReady} />
          </TabsContent>

          <TabsContent value="review">
            {emails.length > 0 && (
              <EmailPreview
                emails={emails}
                onEdit={(index, updated) => {
                  const next = [...emails];
                  next[index] = updated;
                  setEmails(next);
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="send">
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
        </Tabs>
      </div>
    </div>
  );
}
