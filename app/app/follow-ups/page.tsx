'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { SentEmail } from '@/lib/types';
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
import { Search, Mail, Clock, Send, CheckCircle2, XCircle, ExternalLink, RefreshCw, Loader2, MessageSquareReply, ThumbsUp, ThumbsDown, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { FOLLOWUP_TEMPLATES, applyTemplate } from '@/lib/email-templates';
import { dbGetSentEmails, dbUpdateSentEmail } from '@/lib/supabase-db';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    label: 'Replied',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: MessageSquareReply,
  },
  replied_positive: {
    label: 'Replied ✓',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: ThumbsUp,
  },
  replied_negative: {
    label: 'Replied ✗',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: ThumbsDown,
  },
  not_interested: {
    label: 'Archived',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
    icon: XCircle,
  },
} as const;

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Tab = 'pending' | 'follow-up-1' | 'follow-up-2' | 'follow-up-3' | 'replied' | 'not_interested';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FollowUpsPage() {
  const sentEmailsCache = useStore(s => s.sentEmailsCache);
  const setSentEmailsCache = useStore(s => s.setSentEmailsCache);
  const updateSentEmailCache = useStore(s => s.updateSentEmailCache);
  const addToast = useStore(s => s.addToast);
  const [tab, setTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [singleTarget, setSingleTarget] = useState<SentEmail | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkBody, setBulkBody] = useState('');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // Load from Supabase on mount
  useEffect(() => {
    setLoading(true);
    dbGetSentEmails()
      .then(emails => setSentEmailsCache(emails))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [setSentEmailsCache]);

  const sentEmails = sentEmailsCache;

  // Filter logic for each tab
  const getFilteredEmails = (): SentEmail[] => {
    switch (tab) {
      case 'pending':
        return sentEmails.filter(e => e.followUpStatus === 'pending');
      case 'follow-up-1':
        return sentEmails.filter(e => e.followUpStatus === 'followed_up' && e.followUpCount === 1);
      case 'follow-up-2':
        return sentEmails.filter(e => e.followUpStatus === 'followed_up' && e.followUpCount === 2);
      case 'follow-up-3':
        return sentEmails.filter(e => e.followUpStatus === 'followed_up' && e.followUpCount >= 3);
      case 'replied':
        return sentEmails.filter(e => e.followUpStatus === 'replied' || e.followUpStatus === 'replied_positive' || e.followUpStatus === 'replied_negative');
      case 'not_interested':
        return sentEmails.filter(e => e.followUpStatus === 'not_interested');
    }
  };

  const filtered = getFilteredEmails().sort((a, b) => {
    const compA = (a.prospectCompany || '').toLowerCase();
    const compB = (b.prospectCompany || '').toLowerCase();
    return compA.localeCompare(compB);
  });

  // Counts for tab badges
  const counts = {
    pending: sentEmails.filter(e => e.followUpStatus === 'pending').length,
    'follow-up-1': sentEmails.filter(e => e.followUpStatus === 'followed_up' && e.followUpCount === 1).length,
    'follow-up-2': sentEmails.filter(e => e.followUpStatus === 'followed_up' && e.followUpCount === 2).length,
    'follow-up-3': sentEmails.filter(e => e.followUpStatus === 'followed_up' && e.followUpCount >= 3).length,
    replied: sentEmails.filter(e => e.followUpStatus === 'replied' || e.followUpStatus === 'replied_positive' || e.followUpStatus === 'replied_negative').length,
    not_interested: sentEmails.filter(e => e.followUpStatus === 'not_interested').length,
  };

  const needsFollowUp = sentEmails.filter(e => {
    const days = Math.floor((Date.now() - new Date(e.sentAt).getTime()) / (1000 * 60 * 60 * 24));
    return e.followUpStatus === 'pending' && days >= 3;
  }).length;

  const handleMarkRepliedPositive = async (email: SentEmail) => {
    updateSentEmailCache(email.id, { followUpStatus: 'replied_positive' });
    await dbUpdateSentEmail(email.id, { followUpStatus: 'replied_positive' });
    addToast('Marked as replied (positive) 👍', 'success');
  };

  const handleMarkRepliedNegative = async (email: SentEmail) => {
    updateSentEmailCache(email.id, { followUpStatus: 'replied_negative' });
    await dbUpdateSentEmail(email.id, { followUpStatus: 'replied_negative' });
    addToast('Marked as replied (negative) 👎', 'info');
  };

  const handleMarkNotInterested = async (email: SentEmail) => {
    updateSentEmailCache(email.id, { followUpStatus: 'not_interested' });
    await dbUpdateSentEmail(email.id, { followUpStatus: 'not_interested' });
    addToast('Marked as archived', 'info');
  };

  const handleUndoReplied = async (email: SentEmail) => {
    // Revert to followed_up if they had any follow-ups, otherwise back to pending
    const revertStatus = email.followUpCount > 0 ? 'followed_up' : 'pending';
    updateSentEmailCache(email.id, { followUpStatus: revertStatus });
    await dbUpdateSentEmail(email.id, { followUpStatus: revertStatus });
    addToast(`Moved back to ${revertStatus === 'followed_up' ? 'Followed Up' : 'Needs Follow-up'}`, 'info');
  };

  const handleOpenInGmail = (email: SentEmail) => {
    if (email.gmailThreadId) {
      window.open(`https://mail.google.com/mail/u/0/#inbox/${email.gmailThreadId}`, '_blank');
    } else {
      window.open(`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email.prospectEmail)}`, '_blank');
    }
  };

  // ── Selection helpers ──────────────────────────────────────────────────────
  const filteredIds = filtered.map(e => e.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selected.has(id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filteredIds));
  };

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Bulk send ──────────────────────────────────────────────────────────────
  const openBulkDialog = (email?: SentEmail) => {
    // Auto-select a template based on the tab
    let tpl = FOLLOWUP_TEMPLATES[0];
    if (tab === 'follow-up-1') tpl = FOLLOWUP_TEMPLATES[1];
    else if (tab === 'follow-up-2') tpl = FOLLOWUP_TEMPLATES[2];

    setSingleTarget(email || null);
    setBulkSubject(tpl.subject);
    setBulkBody(tpl.body);
    setBulkProgress(0);
    setBulkDialogOpen(true);
  };

  const handleBulkSend = async () => {
    const targets = singleTarget ? [singleTarget] : filtered.filter(e => selected.has(e.id));
    if (targets.length === 0) return;
    setBulkSending(true);
    setBulkDialogOpen(false); // Dismiss immediately, show floating progress
    setBulkProgress(0);
    let sent = 0;

    let senderName = 'Anubhav Bagri';
    try {
      const saved = sessionStorage.getItem('reachout_manual_form_state');
      if (saved) senderName = JSON.parse(saved).senderName || 'Anubhav Bagri';
    } catch { /* ignore */ }

    for (let i = 0; i < targets.length; i++) {
      const email = targets[i];
      let firstName = email.prospectName.split(' ')[0];

      const vars: Record<string, string> = {
        firstName,
        company: email.prospectCompany,
        originalSubject: email.subject.replace(/^Re:\s*/i, ''),
        senderName,
      };
      const subject = `Re: ${vars.originalSubject}`;
      const body = applyTemplate(bulkBody, vars);

      try {
        const res = await fetch('/api/mcp/gmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email.prospectEmail,
            subject,
            body,
            threadId: email.gmailThreadId || undefined,
            fromName: senderName,
          }),
        });
        const data = await res.json();
        if (data.success) {
          sent++;
          const updates = {
            followUpStatus: 'followed_up' as const,
            followUpCount: email.followUpCount + 1,
            lastFollowUpAt: new Date(),
            notes: `Bulk follow-up: ${subject}`,
          };
          updateSentEmailCache(email.id, updates);
          dbUpdateSentEmail(email.id, updates);
        } else {
          console.error(`Error sending to ${email.prospectEmail}:`, data.error);
          addToast(`Failed to send to ${email.prospectEmail}: ${data.error}`, 'error', true);
        }
      } catch (err: any) {
        console.error(`Error sending to ${email.prospectEmail}:`, err);
        addToast(`Failed to send to ${email.prospectEmail}: ${err.message}`, 'error', true);
      }
      setBulkProgress(i + 1);
      if (i < targets.length - 1) await new Promise(r => setTimeout(r, 500));
    }

    setBulkSending(false);
    setSelected(new Set());
    setSingleTarget(null);
    addToast(`${sent}/${targets.length} follow-ups sent successfully.`, sent > 0 ? 'success' : 'error');
  };

  const handleBulkStatusUpdate = (status: 'replied_positive' | 'replied_negative' | 'not_interested') => {
    const targets = filtered.filter(e => selected.has(e.id));
    if (targets.length === 0) return;

    targets.forEach(email => {
      const updates = { followUpStatus: status };
      updateSentEmailCache(email.id, updates);
      dbUpdateSentEmail(email.id, updates);
    });

    setSelected(new Set());
    addToast(`Marked ${targets.length} emails as ${status === 'not_interested' ? 'Archived' : 'Replied'}`, 'success');
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Needs Follow-up' },
    { key: 'follow-up-1', label: 'Follow-up-1' },
    { key: 'follow-up-2', label: 'Follow-up-2' },
    { key: 'follow-up-3', label: 'Follow-up-3' },
    { key: 'replied', label: 'Replied' },
    { key: 'not_interested', label: 'Archive' },
  ];

  const isSelectionAllowed = tab !== 'replied' && tab !== 'not_interested';

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card/50 p-4 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Follow-ups</h1>
            <p className="text-muted-foreground mt-1">
              Track everyone you&apos;ve emailed and manage bulk follow-ups
            </p>
          </div>
          {needsFollowUp > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 text-sm px-3 py-1">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {needsFollowUp} follow-up{needsFollowUp !== 1 ? 's' : ''} due
            </Badge>
          )}
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selected.size} selected</span>
              {tab === 'follow-up-3' ? (
                <>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleBulkStatusUpdate('replied_positive')}>
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Replied (+)
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleBulkStatusUpdate('replied_negative')}>
                    <ThumbsDown className="w-3.5 h-3.5" />
                    Replied (-)
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleBulkStatusUpdate('not_interested')}>
                    <XCircle className="w-3.5 h-3.5" />
                    Archive
                  </Button>
                </>
              ) : (
                <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => openBulkDialog()}>
                  <Send className="w-3.5 h-3.5" />
                  Send Follow-up
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setSelected(new Set());
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
            >
              {t.label} ({counts[t.key]})
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="text-6xl opacity-20">📬</div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {sentEmails.length === 0 ? 'No emails sent yet' : 'No emails in this tab'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {sentEmails.length === 0
                  ? 'Start by searching for prospects and sending emails. They\'ll appear here for follow-up tracking.'
                  : 'Try a different tab above.'}
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
          /* ─── Table View (md+) / Stacked list (mobile) ─────── */
          <>
            {/* ── Mobile: stacked rows ────────────────────────────── */}
            <div className="md:hidden space-y-2">
              {filtered.map(email => {
                const config = STATUS_CONFIG[email.followUpStatus];
                const StatusIcon = config.icon;
                const daysSinceSent = Math.floor(
                  (Date.now() - new Date(email.sentAt).getTime()) / (1000 * 60 * 60 * 24)
                );
                const needsAction = email.followUpStatus === 'pending' && daysSinceSent >= 3;

                return (
                  <div
                    key={email.id}
                    onClick={() => isSelectionAllowed && toggleRow(email.id)}
                    className={`rounded-lg border border-border p-3 space-y-2 ${isSelectionAllowed ? 'cursor-pointer' : ''} ${needsAction ? 'border-yellow-400/60 bg-yellow-50/30 dark:bg-yellow-950/10' : ''} ${selected.has(email.id) ? 'bg-primary/5 border-primary/30' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-3 min-w-0">
                        {isSelectionAllowed && (
                          <div className="pt-0.5">
                            <input type="checkbox" checked={selected.has(email.id)} onChange={() => toggleRow(email.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 accent-primary cursor-pointer" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{email.prospectName}</div>
                          <div className="text-xs text-muted-foreground truncate">{email.prospectEmail}</div>
                          {email.prospectCompany && (
                            <div className="text-xs text-muted-foreground truncate">{email.prospectCompany}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${(email.recipientType || 'HR') === 'HR'
                          ? 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
                          : 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800'
                          }`}>
                          {email.recipientType || 'HR'}
                        </span>
                        <Badge className={`text-[10px] shrink-0 ${config.color} border-0 gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {email.followUpCount > 0 ? `×${email.followUpCount}` : config.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground truncate">{email.subject}</div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(email.sentAt)}
                        {needsAction && <span className="text-yellow-600 dark:text-yellow-400 font-medium ml-1">⚡ Due</span>}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {email.followUpStatus !== 'replied' && email.followUpStatus !== 'replied_positive' && email.followUpStatus !== 'replied_negative' && email.followUpStatus !== 'not_interested' && (
                          <>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Log Follow-up" onClick={(e) => { e.stopPropagation(); openBulkDialog(email); }}>
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Replied (Positive)" onClick={(e) => { e.stopPropagation(); handleMarkRepliedPositive(email); }}>
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" title="Replied (Negative)" onClick={(e) => { e.stopPropagation(); handleMarkRepliedNegative(email); }}>
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" title="Archive" onClick={(e) => { e.stopPropagation(); handleMarkNotInterested(email); }}>
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {(email.followUpStatus === 'replied' || email.followUpStatus === 'replied_positive' || email.followUpStatus === 'replied_negative') && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Undo — move back" onClick={(e) => { e.stopPropagation(); handleUndoReplied(email); }}>
                            <Undo2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Open in Gmail" onClick={(e) => { e.stopPropagation(); handleOpenInGmail(email); }}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop: full table ─────────────────────────────── */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                    {isSelectionAllowed && (
                      <th className="py-3 px-3 w-10">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-primary cursor-pointer" />
                      </th>
                    )}
                    <th className="py-3 px-3 font-medium">Company</th>
                    <th className="py-3 px-3 font-medium">Name</th>
                    <th className="py-3 px-3 font-medium">Email</th>
                    <th className="py-3 px-3 font-medium hidden lg:table-cell">Subject</th>
                    <th className="py-3 px-3 font-medium">Sent</th>
                    <th className="py-3 px-3 font-medium">Type</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                    <th className="py-3 px-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(email => {
                    const config = STATUS_CONFIG[email.followUpStatus];
                    const StatusIcon = config.icon;
                    const daysSinceSent = Math.floor(
                      (Date.now() - new Date(email.sentAt).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const needsAction = email.followUpStatus === 'pending' && daysSinceSent >= 3;

                    return (
                      <tr
                        key={email.id}
                        onClick={() => isSelectionAllowed && toggleRow(email.id)}
                        className={`hover:bg-muted/50 transition-colors ${isSelectionAllowed ? 'cursor-pointer' : ''} ${needsAction ? 'bg-yellow-50/50 dark:bg-yellow-950/10' : ''} ${selected.has(email.id) ? 'bg-primary/5' : ''}`}
                      >
                        {isSelectionAllowed && (
                          <td className="py-3 px-3">
                            <input type="checkbox" checked={selected.has(email.id)} onChange={() => toggleRow(email.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 accent-primary cursor-pointer" />
                          </td>
                        )}
                        <td className="py-3 px-3">
                          <span className="truncate block max-w-[140px] font-medium">{email.prospectCompany}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="truncate max-w-[160px]">{email.prospectName}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-muted-foreground truncate block max-w-[200px]">{email.prospectEmail}</span>
                        </td>
                        <td className="py-3 px-3 hidden lg:table-cell">
                          <span className="truncate block max-w-[200px] text-muted-foreground">{email.subject}</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-xs text-muted-foreground">{formatDate(email.sentAt)}</span>
                          {needsAction && (
                            <span className="block text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">⚡ Due</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${(email.recipientType || 'HR') === 'HR'
                            ? 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
                            : 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800'
                            }`}>
                            {email.recipientType || 'HR'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge className={`text-[10px] ${config.color} border-0 gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {email.followUpCount > 0 ? `×${email.followUpCount}` : config.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-1">
                            {email.followUpStatus !== 'replied' && email.followUpStatus !== 'replied_positive' && email.followUpStatus !== 'replied_negative' && email.followUpStatus !== 'not_interested' && (
                              <>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Log Follow-up" onClick={(e) => { e.stopPropagation(); openBulkDialog(email); }}>
                                  <Send className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Replied (Positive)" onClick={(e) => { e.stopPropagation(); handleMarkRepliedPositive(email); }}>
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" title="Replied (Negative)" onClick={(e) => { e.stopPropagation(); handleMarkRepliedNegative(email); }}>
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" title="Archive" onClick={(e) => { e.stopPropagation(); handleMarkNotInterested(email); }}>
                                  <XCircle className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            {(email.followUpStatus === 'replied' || email.followUpStatus === 'replied_positive' || email.followUpStatus === 'replied_negative') && (
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Undo — move back" onClick={(e) => { e.stopPropagation(); handleUndoReplied(email); }}>
                                <Undo2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Open in Gmail" onClick={(e) => { e.stopPropagation(); handleOpenInGmail(email); }}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Bulk Send Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={(open) => {
        setBulkDialogOpen(open);
        if (!open) setSingleTarget(null);
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{singleTarget ? 'Send Follow-up' : 'Bulk Send Follow-up'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-primary">{singleTarget ? '1 recipient' : `${selected.size} recipients`} selected</span>
            </div>



            <div className="space-y-2">
              <label className="text-sm font-medium">Follow-up Message</label>
              <Textarea
                className="min-h-[200px]"
                value={bulkBody}
                onChange={e => setBulkBody(e.target.value)}
                placeholder="Write your follow-up..."
              />
              <p className="text-xs text-muted-foreground">Available variables: {'{{firstName}}'}, {'{{company}}'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBulkDialogOpen(false);
              setSingleTarget(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleBulkSend} disabled={!bulkSubject || !bulkBody}>
              <Send className="w-4 h-4 mr-2" />
              Send to {singleTarget ? '1' : selected.size} Contact{singleTarget ? '' : selected.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Progress Bar */}
      {bulkSending && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border border-border shadow-lg rounded-xl p-4 w-72 flex flex-col gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Sending Follow-up{singleTarget ? '' : 's'}...
            </span>
            <span className="text-muted-foreground">{bulkProgress} / {singleTarget ? 1 : selected.size}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(bulkProgress / Math.max(1, singleTarget ? 1 : selected.size)) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
