'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { SentEmail } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  MessageSquareReply,
  XCircle,
  Clock,
  Calendar,
  ExternalLink,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { FOLLOWUP_TEMPLATES, applyTemplate } from '@/lib/email-templates';

const STATUS_CONFIG = {
  pending: {
    label: 'Needs Follow-up',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock,
  },
  followed_up: {
    label: 'Followed Up',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: RefreshCw,
  },
  replied: {
    label: 'Replied ✓',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: MessageSquareReply,
  },
  not_interested: {
    label: 'Not Interested',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
    icon: XCircle,
  },
} as const;

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysSince(date: Date | string) {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

function SentEmailCard({ email }: { email: SentEmail }) {
  const updateSentEmail = useStore(state => state.updateSentEmail);
  const markFollowedUp = useStore(state => state.markFollowedUp);
  const addToast = useStore(state => state.addToast);
  const gmailAuth = useStore(state => state.gmailAuth);

  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');

  const config = STATUS_CONFIG[email.followUpStatus];
  const StatusIcon = config.icon;

  const daysSinceSent = Math.floor(
    (Date.now() - new Date(email.sentAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const needsFollowUp = email.followUpStatus === 'pending' && daysSinceSent >= 3;

  const handleMarkReplied = () => {
    updateSentEmail(email.id, { followUpStatus: 'replied' });
    addToast('Marked as replied', 'success');
  };

  const handleMarkNotInterested = () => {
    updateSentEmail(email.id, { followUpStatus: 'not_interested' });
    addToast('Marked as not interested', 'info');
  };

  const handleFollowUp = () => {
    markFollowedUp(email.id, followUpNotes);
    setFollowUpDialogOpen(false);
    setFollowUpNotes('');
    addToast('Follow-up recorded', 'success');
  };

  const handleOpenInGmail = () => {
    if (email.gmailThreadId) {
      window.open(`https://mail.google.com/mail/u/0/#inbox/${email.gmailThreadId}`, '_blank');
    } else {
      window.open(`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email.prospectEmail)}`, '_blank');
    }
  };

  return (
    <>
      <Card className={`p-5 space-y-4 transition-all ${needsFollowUp ? 'ring-2 ring-yellow-400/60 dark:ring-yellow-600/40' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {email.prospectName}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {email.prospectTitle} @ {email.prospectCompany}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {email.prospectEmail}
            </p>
          </div>

          <div className="shrink-0 space-y-1 text-right">
            <Badge className={`text-xs ${config.color} border-0`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
            {needsFollowUp && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                ⚡ Follow-up due
              </p>
            )}
          </div>
        </div>

        {/* Email preview */}
        <div className="bg-muted/40 rounded-lg p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Subject</p>
          <p className="text-sm font-medium">{email.subject}</p>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Sent {formatDate(email.sentAt)} ({daysSince(email.sentAt)})
          </span>
          {email.followUpCount > 0 && (
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              {email.followUpCount} follow-up{email.followUpCount !== 1 ? 's' : ''}
            </span>
          )}
          {email.lastFollowUpAt && (
            <span>Last follow-up: {daysSince(email.lastFollowUpAt)}</span>
          )}
        </div>

        {email.notes && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
            {email.notes}
          </p>
        )}

        {/* Actions */}
        {email.followUpStatus !== 'replied' && email.followUpStatus !== 'not_interested' && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={() => setFollowUpDialogOpen(true)}
            >
              <Send className="w-3 h-3" />
              Log Follow-up
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700"
              onClick={handleMarkReplied}
            >
              <CheckCircle2 className="w-3 h-3" />
              Marked Replied
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 h-8 text-xs text-muted-foreground"
              onClick={handleMarkNotInterested}
            >
              <XCircle className="w-3 h-3" />
              Not Interested
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 h-8 text-xs ml-auto"
              onClick={handleOpenInGmail}
            >
              <ExternalLink className="w-3 h-3" />
              Open in Gmail
            </Button>
          </div>
        )}

        {(email.followUpStatus === 'replied' || email.followUpStatus === 'not_interested') && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 h-8 text-xs text-muted-foreground"
            onClick={handleOpenInGmail}
          >
            <ExternalLink className="w-3 h-3" />
            Open in Gmail
          </Button>
        )}
      </Card>

      {/* Follow-up dialog */}
      <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Follow-up — {email.prospectName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {/* Template picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Follow-up Template</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {FOLLOWUP_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      const vars: Record<string, string> = {
                        firstName: email.prospectName.split(' ')[0],
                        company: email.prospectCompany,
                        originalSubject: email.subject,
                        senderName: '[Your name]',
                      };
                      const body = applyTemplate(t.body, vars);
                      const subject = applyTemplate(t.subject, vars);
                      setFollowUpNotes(`Subject: ${subject}\n\n${body}`);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all hover:border-primary text-xs`}
                  >
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-muted-foreground mt-0.5">Recommended after {t.daysAfter} days · Subject: {applyTemplate(t.subject, { originalSubject: email.subject })}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Editable text area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Email content to send</label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(followUpNotes);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Copy to clipboard
                </button>
              </div>
              <Textarea
                placeholder="Select a template above or write your own follow-up notes..."
                value={followUpNotes}
                onChange={e => setFollowUpNotes(e.target.value)}
                rows={5}
                className="text-xs font-mono resize-none"
              />
            </div>

            <div className="bg-muted/50 rounded p-2.5 text-xs text-muted-foreground flex items-start gap-2">
              <span>💡</span>
              <span>Copy the email above → send it from your{' '}
                <button
                  className="text-primary underline"
                  onClick={() => window.open(`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email.prospectEmail)}`, '_blank')}
                >
                  Gmail thread ↗
                </button>
                {' '}→ come back and click &ldquo;Log Follow-up&rdquo; to record it.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowUpDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleFollowUp}>Log Follow-up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function FollowUpsPage() {
  const sentEmails = useStore(state => state.sentEmails);
  const [filter, setFilter] = useState<'all' | 'pending' | 'followed_up' | 'replied' | 'not_interested'>('all');

  const filtered = sentEmails.filter(e =>
    filter === 'all' ? true : e.followUpStatus === filter
  );

  const needsFollowUp = sentEmails.filter(e => {
    const days = Math.floor((Date.now() - new Date(e.sentAt).getTime()) / (1000 * 60 * 60 * 24));
    return e.followUpStatus === 'pending' && days >= 3;
  }).length;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card/50 p-4 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Follow-ups</h1>
            <p className="text-muted-foreground mt-1">
              Track everyone you&apos;ve emailed and manage follow-ups
            </p>
          </div>
          {needsFollowUp > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 text-sm px-3 py-1">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {needsFollowUp} follow-up{needsFollowUp !== 1 ? 's' : ''} due
            </Badge>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'followed_up', 'replied', 'not_interested'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {f === 'all' ? `All (${sentEmails.length})` :
               f === 'pending' ? `Needs Follow-up (${sentEmails.filter(e => e.followUpStatus === 'pending').length})` :
               f === 'followed_up' ? `Followed Up (${sentEmails.filter(e => e.followUpStatus === 'followed_up').length})` :
               f === 'replied' ? `Replied (${sentEmails.filter(e => e.followUpStatus === 'replied').length})` :
               `Not Interested (${sentEmails.filter(e => e.followUpStatus === 'not_interested').length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="text-6xl opacity-20">📬</div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {sentEmails.length === 0 ? 'No emails sent yet' : 'No emails in this filter'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {sentEmails.length === 0
                  ? 'Start by searching for prospects and sending emails. They\'ll appear here for follow-up tracking.'
                  : 'Try a different filter above.'}
              </p>
            </div>
            {sentEmails.length === 0 && (
              <Link href="/app">
                <Button className="gap-2">
                  <Mail className="w-4 h-4" />
                  Find Prospects
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl">
            {filtered.map(email => (
              <SentEmailCard key={email.id} email={email} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
