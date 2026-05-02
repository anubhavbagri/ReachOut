'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Email {
  prospectId: string;
  prospectName: string;
  prospectEmail: string;
  subject: string;
  body: string;
}

interface EmailBulkSenderProps {
  emails: Email[];
  onComplete?: () => void;
}

export function EmailBulkSender({ emails, onComplete }: EmailBulkSenderProps) {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sent, setSent] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [delayMs, setDelayMs] = useState(1000);
  const addToast = useStore(state => state.addToast);

  const handleSend = async () => {
    setSending(true);
    setProgress(0);
    setSent([]);
    setFailed([]);

    for (let i = 0; i < emails.length; i++) {
      try {
        // Simulate API call to send email
        console.log(`[v0] Sending email to ${emails[i].prospectEmail}`);

        // Mock API delay
        await new Promise(resolve => setTimeout(resolve, delayMs));

        setSent(prev => [...prev, emails[i].prospectEmail]);
        setProgress(i + 1);
      } catch (error) {
        console.error(`[v0] Failed to send to ${emails[i].prospectEmail}:`, error);
        setFailed(prev => [...prev, emails[i].prospectEmail]);
      }
    }

    setSending(false);
    addToast(`Sent ${sent.length} emails`, 'success');
    onComplete?.();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold mb-2">Send Emails</h2>
        <p className="text-muted-foreground">
          Configure sending preferences and send all emails at once
        </p>
      </div>

      {/* Settings */}
      {!sending && sent.length === 0 && (
        <Card className="p-6 space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel>Delay Between Emails (milliseconds)</FieldLabel>
              <Input
                type="number"
                min={100}
                max={10000}
                step={100}
                value={delayMs}
                onChange={e => setDelayMs(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {emails.length} emails will take approximately {(delayMs * emails.length) / 1000}
                {' '}seconds to send
              </p>
            </Field>
          </FieldGroup>

          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Before you send:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Make sure all email addresses are correct</li>
              <li>✓ Review all email content one more time</li>
              <li>✓ Gmail integration will send from your account</li>
              <li>✓ You can track opens and replies in Gmail</li>
            </ul>
          </div>

          <Button
            onClick={handleSend}
            disabled={emails.length === 0}
            className="w-full gap-2"
            size="lg"
          >
            <Mail className="w-4 h-4" />
            Send {emails.length} Emails
          </Button>
        </Card>
      )}

      {/* Progress */}
      {sending && (
        <Card className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Sending emails...</h3>
              <span className="text-sm text-muted-foreground">
                {progress} of {emails.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${(progress / emails.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {emails.slice(0, progress).map((email, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded hover:bg-muted text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="truncate text-muted-foreground">
                  {email.prospectEmail}
                </span>
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
      {!sending && sent.length > 0 && (
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold">All emails sent!</h3>
            <p className="text-muted-foreground">
              {sent.length} emails were successfully sent
            </p>
          </div>

          {failed.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-yellow-800 font-medium">
                <AlertCircle className="w-4 h-4" />
                {failed.length} email{failed.length !== 1 ? 's' : ''} failed to send
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                {failed.map((email, idx) => (
                  <li key={idx}>• {email}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => {
              setSent([]);
              setFailed([]);
              setProgress(0);
            }}>
              Send More Emails
            </Button>
            <Button onClick={onComplete}>
              Done
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
