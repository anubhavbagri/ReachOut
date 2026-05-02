'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { generateEmailsBatch } from '@/lib/email-generator';
import { EmailPreview } from '@/components/email-preview';
import { EmailGenerator } from '@/components/email-generator';
import { EmailBulkSender } from '@/components/email-bulk-sender';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ComposePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'compose' | 'review' | 'send'>('compose');
  const [emails, setEmails] = useState<any[]>([]);

  const selectedProspects = useStore(state => state.selectedProspects);
  const getSelectedProspectsData = useStore(state => state.getSelectedProspectsData);
  const compose = useStore(state => state.compose);
  const setComposeLoading = useStore(state => state.setComposeLoading);
  const setComposeProgress = useStore(state => state.setComposeProgress);
  const addToast = useStore(state => state.addToast);

  if (selectedProspects.size === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-8 text-center max-w-md space-y-4">
          <h2 className="text-2xl font-bold">No prospects selected</h2>
          <p className="text-muted-foreground">
            Go back to search and select prospects before composing emails
          </p>
          <Button onClick={() => router.push('/app')}>
            Back to Search
          </Button>
        </Card>
      </div>
    );
  }

  const selectedData = getSelectedProspectsData();

  const handleGenerateEmails = async (context: string, tone: 'professional' | 'friendly' | 'casual') => {
    setComposeLoading(true);
    setActiveTab('review');

    try {
      const generatedEmails = await generateEmailsBatch(
        selectedData,
        context,
        tone,
        (current, total) => setComposeProgress(current, total)
      );

      setEmails(generatedEmails);
      addToast(`Generated ${generatedEmails.length} emails`, 'success');
    } catch (error) {
      console.error('[v0] Email generation error:', error);
      addToast('Failed to generate emails', 'error');
      setActiveTab('compose');
    } finally {
      setComposeLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/app')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Compose Emails</h1>
            <p className="text-muted-foreground">
              {selectedProspects.size} prospects selected
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full max-w-xs grid-cols-3">
              <TabsTrigger value="compose">Generate</TabsTrigger>
              <TabsTrigger value="review" disabled={emails.length === 0}>
                Review
              </TabsTrigger>
              <TabsTrigger value="send" disabled={emails.length === 0}>
                Send
              </TabsTrigger>
            </TabsList>

            {/* Generate Tab */}
            <TabsContent value="compose" className="space-y-6 mt-6">
              <EmailGenerator
                prospectCount={selectedProspects.size}
                onGenerate={handleGenerateEmails}
                loading={compose.loading}
              />
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="space-y-6 mt-6">
              {emails.length > 0 && (
                <EmailPreview
                  emails={emails}
                  onEdit={(index, updated) => {
                    const newEmails = [...emails];
                    newEmails[index] = updated;
                    setEmails(newEmails);
                  }}
                />
              )}
            </TabsContent>

            {/* Send Tab */}
            <TabsContent value="send" className="space-y-6 mt-6">
              {emails.length > 0 && (
                <EmailBulkSender
                  emails={emails}
                  onComplete={() => {
                    addToast('Emails sent successfully!', 'success');
                    router.push('/app');
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
