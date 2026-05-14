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
import { ArrowLeft, Loader2, Mail, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ComposePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'compose' | 'review' | 'send'>('compose');
  const [emails, setEmails] = useState<any[]>([]);

  const emailList = useStore(state => state.emailList);
  const removeFromEmailList = useStore(state => state.removeFromEmailList);
  const clearEmailList = useStore(state => state.clearEmailList);
  const compose = useStore(state => state.compose);
  const setComposeLoading = useStore(state => state.setComposeLoading);
  const setComposeProgress = useStore(state => state.setComposeProgress);
  const addToast = useStore(state => state.addToast);

  // Convert email list entries to Prospect-shaped objects for generation
  const prospectsForGeneration = emailList.map(e => ({
    id: e.prospectId,
    firstName: e.prospectName.split(' ')[0],
    lastName: e.prospectName.split(' ').slice(1).join(' '),
    email: e.prospectEmail,
    company: e.prospectCompany,
    title: e.prospectTitle,
    score: 85,
    source: 'apollo' as const,
    createdAt: new Date(),
  }));

  if (emailList.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md space-y-4 w-full">
          <div className="text-4xl">📭</div>
          <h2 className="text-xl font-bold">No people in send list</h2>
          <p className="text-muted-foreground text-sm">
            Go to Search, reveal emails, and click &ldquo;Add to send list&rdquo; on each person you want to email.
          </p>
          <Link href="/app">
            <Button className="gap-2 w-full sm:w-auto">
              <Mail className="w-4 h-4" />
              Find People
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleGenerateEmails = async (context: string, tone: 'professional' | 'friendly' | 'casual') => {
    setComposeLoading(true);
    setActiveTab('review');

    try {
      const generatedEmails = await generateEmailsBatch(
        prospectsForGeneration as any,
        context,
        tone,
        (current, total) => setComposeProgress(current, total),
        700
        // Gemini API key read from GOOGLE_GENERATIVE_AI_API_KEY env var server-side
      );

      setEmails(generatedEmails);
      addToast(`Generated ${generatedEmails.length} emails`, 'success');
    } catch (error) {
      console.error('[ReachOut] Email generation error:', error);
      addToast('Failed to generate emails — check GOOGLE_GENERATIVE_AI_API_KEY in Vercel env vars', 'error');
      setActiveTab('compose');
    } finally {
      setComposeLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4 md:p-6 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/app')}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Compose Emails</h1>
            <p className="text-muted-foreground text-sm">
              {emailList.length} {emailList.length === 1 ? 'person' : 'people'} in send list
            </p>
          </div>
        </div>

        {/* Send list pills */}
        <div className="flex flex-wrap gap-1.5">
          {emailList.map(e => (
            <div
              key={e.prospectId}
              className="flex items-center gap-1 bg-muted rounded-full pl-2.5 pr-1 py-1 text-xs"
            >
              <span className="font-medium">{e.prospectName}</span>
              <span className="text-muted-foreground truncate max-w-[120px]">· {e.prospectEmail}</span>
              <button
                onClick={() => removeFromEmailList(e.prospectId)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>


      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full max-w-xs grid-cols-3 h-9">
              <TabsTrigger value="compose" className="text-xs">Generate</TabsTrigger>
              <TabsTrigger value="review" disabled={emails.length === 0} className="text-xs">
                Review{emails.length > 0 ? ` (${emails.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="send" disabled={emails.length === 0} className="text-xs">
                Send
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-6 mt-6">
              <EmailGenerator
                prospectCount={emailList.length}
                onGenerate={handleGenerateEmails}
                loading={compose.loading}
              />
            </TabsContent>

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

            <TabsContent value="send" className="space-y-6 mt-6">
              {emails.length > 0 && (
                <EmailBulkSender
                  emails={emails.map((e: any) => ({
                    prospectId: e.prospectId,
                    prospectName: e.prospectName,
                    prospectEmail: e.prospectEmail,
                    prospectCompany: emailList.find(l => l.prospectId === e.prospectId)?.prospectCompany || '',
                    prospectTitle: emailList.find(l => l.prospectId === e.prospectId)?.prospectTitle || '',
                    subject: e.subject,
                    body: e.body,
                  }))}
                  onComplete={() => {
                    clearEmailList();
                    addToast('All sent! Track follow-ups in the Follow-ups tab.', 'success');
                    router.push('/app/follow-ups');
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
