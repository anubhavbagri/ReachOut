'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { SentEmail } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
} from 'lucide-react';

interface Email {
  prospectId: string;
  prospectName: string;
  prospectEmail: string;
  prospectCompany: string;
  prospectTitle: string;
  subject: string;
  body: string;
}

interface EmailBulkSenderProps {
  emails: Email[];
  onComplete?: () => void;
}

interface SendResult {
  email: string;
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

export function EmailBulkSender({ emails, onComplete }: EmailBulkSenderProps) {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SendResult[]>([]);
  const [delayMs, setDelayMs] = useState(1500);

  const addToast = useStore(state => state.addToast);
  const gmailAuth = useStore(state => state.gmailAuth);
  const settings = useStore(state => state.settings);
  const addSentEmail = useStore(state => state.addSentEmail);

  const isGmailConnected = gmailAuth.isAuthenticated && gmailAuth.refreshToken;

  const handleSend = async () => {
    if (!isGmailConnected) {
      addToast('Connect your Gmail account in Settings first', 'error');
      return;
    }

    setSending(true);
    setProgress(0);
    setResults([]);

    const newResults: SendResult[] = [];

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];

      try {
        const res = await fetch('/api/mcp/gmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            refreshToken: gmailAuth.refreshToken,
            to: email.prospectEmail,
            subject: email.subject,
            body: email.body,
            fromEmail: gmailAuth.userEmail,
          }),
        });

        const data = await res.json() as {
          success?: boolean;
          messageId?: string;
          threadId?: string;
          error?: string;
        };

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Send failed');
        }

        newResults.push({
          email: email.prospectEmail,
          success: true,
          messageId: data.messageId,
          threadId: data.threadId,
        });

        // Record in follow-up tracker
        const sentRecord: SentEmail = {
          id: `sent-${Date.now()}-${i}`,
          prospectId: email.prospectId,
          prospectName: email.prospectName,
          prospectEmail: email.prospectEmail,
          prospectCompany: email.prospectCompany,
          prospectTitle: email.prospectTitle,
          subject: email.subject,
          body: email.body,
          sentAt: new Date(),
          followUpStatus: 'pending',
          followUpCount: 0,
          gmailThreadId: data.threadId,
        };
        addSentEmail(sentRecord);

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[ReachOut] Failed to send to ${email.prospectEmail}:`, errMsg);
        newResults.push({ email: email.prospectEmail, success: false, error: errMsg });
      }

      setResults([...newResults]);
      setProgress(i + 1);

      // Rate limiting delay (except after last email)
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    setSending(false);
    const sent = newResults.filter(r => r.success).length;
    const failed = newResults.filter(r => !r.success).length;
    addToast(
      failed > 0
        ? `Sent ${sent} emails, ${failed} failed`
        : `${sent} emails sent successfully!`,
      failed > 0 ? 'warning' : 'success'
    );
    onComplete?.();
  };

  const isDone = !sending && results.length > 0;
  const sentCount = results.filter(r => r.success).length;
  const failedResults = results.filter(r => !r.success);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold mb-2">Send Emails</h2>
        <p className="text-muted-foreground">
          Emails will be sent directly from your Gmail account
        </p>
      </div>

      {/* Gmail status */}
      {!isGmailConnected && (
        <Card className="p-4 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Gmail not connected
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                You need to connect your Gmail account before sending emails.
              </p>
              <a
                href="/app/settings"
                className="text-xs text-yellow-800 dark:text-yellow-300 underline flex items-center gap-1 w-fit"
              >
                Go to Settings <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </Card>
      )}

      {isGmailConnected && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          Sending as <strong>{gmailAuth.userEmail}</strong>
        </div>
      )}

      {/* Settings */}
      {!sending && results.length === 0 && (
        <Card className="p-6 space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel>Delay Between Emails (ms)</FieldLabel>
              <Input
                type="number"
                min={500}
                max={30000}
                step={500}
                value={delayMs}
                onChange={e => setDelayMs(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {emails.length} emails ≈ {Math.ceil((delayMs * (emails.length - 1)) / 1000)}s total. Minimum 500ms recommended.
              </p>
            </Field>
          </FieldGroup>

          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Before you send:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Emails will be sent from your personal Gmail ({gmailAuth.userEmail || 'not connected'})</li>
              <li>✓ Each email will be tracked in Follow-ups automatically</li>
              <li>✓ All {emails.length} prospects have valid email addresses</li>
              <li>✓ You can check replies directly in Gmail</li>
            </ul>
          </div>

          <Button
            onClick={handleSend}
            disabled={emails.length === 0 || !isGmailConnected}
            className="w-full gap-2"
            size="lg"
          >
            <Send className="w-4 h-4" />
            Send {emails.length} Email{emails.length !== 1 ? 's' : ''}
          </Button>
        </Card>
      )}

      {/* Progress */}
      {sending && (
        <Card className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Sending emails...</h3>
              <span className="text-sm text-muted-foreground">{progress} of {emails.length}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${(progress / emails.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((r, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded hover:bg-muted text-sm">
                {r.success ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <span className="truncate text-muted-foreground">{r.email}</span>
                {!r.success && r.error && (
                  <span className="text-xs text-red-500 truncate">{r.error}</span>
                )}
              </div>
            ))}
            {progress < emails.length && (
              <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending to {emails[progress]?.prospectEmail}...
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Complete */}
      {isDone && (
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold">{sentCount} emails sent!</h3>
            <p className="text-muted-foreground">
              Tracked in Follow-ups for easy follow-up management
            </p>
            <a
              href="/app/follow-ups"
              className="text-sm text-primary hover:underline flex items-center gap-1 justify-center"
            >
              View Follow-ups <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {failedResults.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-400 font-medium text-sm">
                <AlertCircle className="w-4 h-4" />
                {failedResults.length} failed to send
              </div>
              <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
                {failedResults.map((r, idx) => (
                  <li key={idx}>• {r.email}: {r.error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => {
              setResults([]);
              setProgress(0);
            }}>
              Send More
            </Button>
            <Button onClick={onComplete}>Done</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
