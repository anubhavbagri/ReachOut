'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  applyTemplate,
  HR_OUTREACH_TEMPLATE,
  HM_OUTREACH_TEMPLATE,
} from '@/lib/email-templates';
import {
  EmailTone,
} from '@/lib/email-generator';
import {
  Upload,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Wand2,
  FileText,
  AlertCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ManualContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  website?: string;
  recipientType: 'HR' | 'HM';
}

interface ManualSendFormProps {
  onEmailsReady: (
    emails: Array<{
      prospectId: string;
      prospectName: string;
      prospectEmail: string;
      prospectCompany: string;
      prospectTitle: string;
      subject: string;
      body: string;
    }>
  ) => void;
  /** Called whenever the contact list changes so the page can sync its panel */
  onContactsChange?: () => void;
}

type GenerationMode = 'template' | 'jd';

// ─── CSV Parser ───────────────────────────────────────────────────────────────
// Supported format: Name, Email, Company (commas, tabs, or multiple spaces)

function splitRow(row: string): string[] {
  // Try comma first
  if (row.includes(',')) {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }
  // Try tab-separated
  if (row.includes('\t')) {
    return row.split('\t').map(s => s.trim()).filter(Boolean);
  }
  // Fall back to multiple-space splitting (2+ spaces = delimiter)
  return row.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
}

function parseContacts(raw: string, recipientType: 'HR' | 'HM' = 'HR'): ManualContact[] {
  const lines = raw.trim().split('\n').filter(l => l.trim());
  const contacts: ManualContact[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cols = splitRow(lines[i]);
    // Skip header row
    if (i === 0 && (cols[0].toLowerCase().includes('name') || cols[0].toLowerCase() === 'first')) continue;
    if (cols.length < 2) continue;

    // Format: Name, Email, Company
    const nameParts = cols[0].split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const email = cols[1];
    const company = cols[2] || '';

    if (!email || !email.includes('@')) continue;

    contacts.push({
      id: `manual-${Date.now()}-${i}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      company: company.trim(),
      title: '',
      website: '',
      recipientType,
    });
  }
  return contacts;
}

// ─── Session Storage key ─────────────────────────────────────────────────────
const SESSION_KEY = 'reachout_manual_form_state';

// ─── Main Component ───────────────────────────────────────────────────────────

export function ManualSendForm({ onEmailsReady, onContactsChange }: ManualSendFormProps) {
  const addToast = useStore(s => s.addToast);
  const emailList = useStore(s => s.emailList);
  const clearEmailList = useStore(s => s.clearEmailList);
  const prefs = useStore(s => s.prefs);

  // Contacts — persisted in sessionStorage
  const [contacts, setContacts] = useState<ManualContact[]>([]);
  const [csvText, setCsvText] = useState('');
  const [showCsvInput, setShowCsvInput] = useState(true);
  const [parseError, setParseError] = useState('');

  // Manual row add — Name, Email, Company order
  const [newRow, setNewRow] = useState({ firstName: '', lastName: '', email: '', company: '', recipientType: 'HR' as 'HR' | 'HM' });

  // Generation mode (template | jd) — no domain mode
  const [mode, setMode] = useState<GenerationMode>('template');
  const [previewType, setPreviewType] = useState<'HR' | 'HM'>('HR');
  const [senderName, setSenderName] = useState('Anubhav Bagri');
  const [tone, setTone] = useState<EmailTone>('professional');
  const [jobDescription, setJobDescription] = useState('');

  // Editable templates — initialized from canonical imports in email-templates.ts
  const [hrSubject, setHrSubject] = useState(HR_OUTREACH_TEMPLATE.subject);
  const [hrBody, setHrBody] = useState(HR_OUTREACH_TEMPLATE.body);
  const [hmSubject, setHmSubject] = useState(HM_OUTREACH_TEMPLATE.subject);
  const [hmBody, setHmBody] = useState(HM_OUTREACH_TEMPLATE.body);

  // Generating
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Hydration guard to prevent overwriting sessionStorage on mount
  const [isHydrated, setIsHydrated] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Hydrate + import on mount (single effect to avoid races) ────────────────
  useEffect(() => {
    // 1. Hydrate form fields from sessionStorage
    let hydrated: ManualContact[] = [];
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.contacts?.length) hydrated = parsed.contacts;
        if (parsed.senderName) setSenderName(parsed.senderName);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.tone) setTone(parsed.tone);
        if (parsed.jobDescription) setJobDescription(parsed.jobDescription);
        if (parsed.hrSubject) setHrSubject(parsed.hrSubject);
        if (parsed.hrBody) setHrBody(parsed.hrBody);
        if (parsed.hmSubject) setHmSubject(parsed.hmSubject);
        if (parsed.hmBody) setHmBody(parsed.hmBody);
      }
    } catch { /* ignore */ }

    // 2. Merge any pending contacts from the store's emailList (e.g. from Revealed page)
    if (emailList.length > 0) {
      const imported: ManualContact[] = emailList.map(entry => {
        const nameParts = entry.prospectName.trim().split(' ');
        return {
          id: entry.prospectId,
          firstName: nameParts[0] || '',
          lastName: '', // Only use first name from revealed list
          email: entry.prospectEmail,
          company: entry.prospectCompany,
          title: entry.prospectTitle || '',
          recipientType: entry.recipientType || 'HR',
        };
      });
      const existingIds = new Set(hydrated.map(c => c.id));
      const fresh = imported.filter(c => !existingIds.has(c.id));
      hydrated = [...hydrated, ...fresh];
      clearEmailList();
      addToast(`${imported.length} contact${imported.length !== 1 ? 's' : ''} imported from send list`, 'success');
    }

    if (hydrated.length > 0) setContacts(hydrated);
    setIsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // ── Persist state in sessionStorage ────────────────────────────────────────

  // Save to sessionStorage whenever key state changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        contacts,
        senderName,
        mode,
        tone,
        jobDescription,
        hrSubject,
        hrBody,
        hmSubject,
        hmBody,
      }));
    } catch { /* ignore */ }
  }, [contacts, senderName, mode, tone, jobDescription, hrSubject, hrBody, hmSubject, hmBody]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  // Read the authoritative contacts from sessionStorage (which the page keeps in sync
  // when removing/clearing contacts from the right-hand panel).
  const getLatestContacts = useCallback((): ManualContact[] => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.contacts)) return parsed.contacts;
      }
    } catch { /* ignore */ }
    return contacts; // fallback to React state
  }, [contacts]);

  // Sync state if the page updates sessionStorage (via remove/clear)
  useEffect(() => {
    const handleSync = () => {
      setContacts(getLatestContacts());
    };
    window.addEventListener('contacts-updated', handleSync);
    return () => window.removeEventListener('contacts-updated', handleSync);
  }, [getLatestContacts]);

  // Notify page whenever contacts change
  useEffect(() => {
    if (!isHydrated) return;
    onContactsChange?.();
  }, [contacts, onContactsChange, isHydrated]);

  // ── Contact parsing ────────────────────────────────────────────────────────

  const handlePasteContacts = () => {
    setParseError('');
    if (!csvText.trim()) return;
    const parsed = parseContacts(csvText, newRow.recipientType);
    if (parsed.length === 0) {
      setParseError('Could not parse any contacts. Format: Name, Email, Company');
      return;
    }
    const latest = getLatestContacts();
    const existingEmails = new Set(latest.map(c => c.email));
    const merged = [...latest, ...parsed.filter(c => !existingEmails.has(c.email))];
    setContacts(merged);
    setCsvText('');
    setShowCsvInput(false);
    addToast(`Added ${parsed.length} contacts`, 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseContacts(text, newRow.recipientType);
      if (parsed.length === 0) {
        setParseError('Could not parse CSV file. Format: Name, Email, Company');
        return;
      }
      const latest = getLatestContacts();
      const existingEmails = new Set(latest.map(c => c.email));
      const merged = [...latest, ...parsed.filter(c => !existingEmails.has(c.email))];
      setContacts(merged);
      addToast(`Imported ${parsed.length} contacts from CSV`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddRow = () => {
    if (!newRow.email.includes('@') || !newRow.firstName) return;
    const latest = getLatestContacts();
    setContacts([...latest, {
      id: `manual-${Date.now()}`,
      firstName: newRow.firstName,
      lastName: newRow.lastName,
      email: newRow.email,
      company: newRow.company,
      title: '',
      website: '',
      recipientType: newRow.recipientType,
    }]);
    setNewRow({ firstName: '', lastName: '', email: '', company: '', recipientType: 'HR' });
  };

  const handleRemoveContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const toggleRecipientType = (id: string) => {
    setContacts(prev => prev.map(c =>
      c.id === id ? { ...c, recipientType: c.recipientType === 'HR' ? 'HM' : 'HR' } : c
    ));
  };

  // ── Email generation ───────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (contacts.length === 0) {
      addToast('Add contacts first', 'warning');
      return;
    }

    setGenerating(true);
    setProgress(0);
    const emails = [];
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];

      // Use the editable template state based on HR vs HM
      const tplSubject = c.recipientType === 'HM' ? hmSubject : hrSubject;
      const tplBody = c.recipientType === 'HM' ? hmBody : hrBody;

      try {
        let generated: { subject: string; body: string };

        if (mode === 'template') {
          const vars: Record<string, string> = {
            firstName: c.firstName,
            lastName: c.lastName,
            company: c.company,
            title: c.title,
            senderName: senderName || 'Anubhav Bagri',
            linkedinUrl: prefs.linkedinUrl || '',
            githubUrl: prefs.githubUrl || '',
            portfolioUrl: prefs.portfolioUrl || '',
            resumeUrl: prefs.resumeUrl || '',
          };
          generated = {
            subject: applyTemplate(tplSubject, vars),
            body: applyTemplate(tplBody, vars),
          };
        } else {
          // JD mode — server-side Gemini call
          const res = await fetch('/api/generate-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prospect: { id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, company: c.company, title: c.title },
              mode: 'jd',
              jobDescription,
              tone,
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Generation failed');
          generated = { subject: json.data.subject, body: json.data.body };
          if (senderName) {
            generated.body = generated.body.replace(/\[your name\]/i, senderName);
          }
        }

        emails.push({
          prospectId: c.id,
          prospectName: `${c.firstName} ${c.lastName}`.trim(),
          prospectEmail: c.email,
          prospectCompany: c.company,
          prospectTitle: c.title,
          subject: generated.subject,
          body: generated.body,
          recipientType: c.recipientType || 'HR',
        });
      } catch (err) {
        console.error(`Failed for ${c.email}:`, err);
        const fbSubject = c.recipientType === 'HM' ? hmSubject : hrSubject;
        const fbBody = c.recipientType === 'HM' ? hmBody : hrBody;
        const vars: Record<string, string> = {
          firstName: c.firstName, lastName: c.lastName, company: c.company,
          title: c.title, senderName: senderName || 'Anubhav Bagri',
          linkedinUrl: prefs.linkedinUrl || '',
          githubUrl: prefs.githubUrl || '',
          portfolioUrl: prefs.portfolioUrl || '',
          resumeUrl: prefs.resumeUrl || '',
        };
        emails.push({
          prospectId: c.id,
          prospectName: `${c.firstName} ${c.lastName}`.trim(),
          prospectEmail: c.email,
          prospectCompany: c.company,
          prospectTitle: c.title,
          subject: applyTemplate(fbSubject, vars),
          body: applyTemplate(fbBody, vars),
          recipientType: c.recipientType || 'HR',
        });
      }

      setProgress(i + 1);
      if (i < contacts.length - 1 && mode !== 'template') {
        await delay(700);
      }
    }

    setGenerating(false);
    onEmailsReady(emails);
    addToast(`Generated ${emails.length} emails — review before sending`, 'success');
  };

  return (
    <div className="space-y-6 w-full">

      {/* Step 1: Add Contacts */}
      <Card className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base">Step 1 — Add Contacts</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Paste list, upload a file, or add manually</p>
          </div>
          {contacts.length > 0 && (
            <Badge variant="secondary" className="md:hidden">{contacts.length} contacts</Badge>
          )}
        </div>

        {/* CSV paste area */}
        <div className="space-y-2">
          <button
            onClick={() => setShowCsvInput(v => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {showCsvInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Paste list / CSV
          </button>
          {showCsvInput && (
            <div className="space-y-2">
              <Textarea
                placeholder={`Format: Name, Email, Company\n\nJohn Smith, john@stripe.com, Stripe\nJane Doe, jane@figma.com, Figma`}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                rows={5}
                className="text-xs font-mono resize-none"
              />
              {parseError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {parseError}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handlePasteContacts} disabled={!csvText.trim()} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Parse & Add
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Upload CSV
                </Button>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              </div>
            </div>
          )}
        </div>

        {/* Manual add row */}
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Add one manually</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Input placeholder="Name *" value={newRow.firstName} onChange={e => setNewRow(p => ({ ...p, firstName: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder="Email *" type="email" value={newRow.email} onChange={e => setNewRow(p => ({ ...p, email: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder="Company" value={newRow.company} onChange={e => setNewRow(p => ({ ...p, company: e.target.value }))} className="h-8 text-xs" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className={newRow.recipientType === 'HR' ? 'font-semibold text-foreground' : 'text-muted-foreground'}>HR</span>
              <button type="button" onClick={() => setNewRow(p => ({ ...p, recipientType: p.recipientType === 'HR' ? 'HM' : 'HR' }))} className={`relative w-9 h-5 rounded-full transition-colors ${newRow.recipientType === 'HM' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${newRow.recipientType === 'HM' ? 'translate-x-4' : ''}`} />
              </button>
              <span className={newRow.recipientType === 'HM' ? 'font-semibold text-foreground' : 'text-muted-foreground'}>HM</span>
            </div>
            <Button size="sm" variant="outline" onClick={handleAddRow} disabled={!newRow.firstName || !newRow.email.includes('@')} className="gap-1.5 h-8 text-xs">
              <Plus className="w-3 h-3" /> Add Contact
            </Button>
          </div>
        </div>
      </Card>

      {/* Step 2: Email Content */}
      <Card className="p-4 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-base">Step 2 — Email Content</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Choose how emails are generated</p>
          </div>
          {/* Generate button — top-right of this card, always visible */}
          <Button
            onClick={handleGenerate}
            disabled={generating || contacts.length === 0 || (mode === 'jd' && !jobDescription.trim())}
            size="sm"
            className="gap-1.5 shrink-0"
          >
            {generating ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating {progress}/{contacts.length}...</>
            ) : (
              <><Wand2 className="w-3.5 h-3.5" />Generate {contacts.length > 0 ? contacts.length : ''} Email{contacts.length !== 1 ? 's' : ''}</>
            )}
          </Button>
        </div>

        {/* Mode selector — Template and AI by JD only */}
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: 'template', label: 'Template', icon: FileText, desc: 'Fast variable substitution' },
            { id: 'jd', label: 'AI by Job Description', icon: Wand2, desc: 'Gemini tailors to job post' },
          ] as const).map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`p-3 rounded-lg border-2 text-left transition-all space-y-1 ${mode === id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${mode === id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold">{label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
            </button>
          ))}
        </div>

        {/* Sender name — defaults to Anubhav Bagri */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Your name (replaces {'{{senderName}}'})</label>
          <Input
            placeholder="Anubhav Bagri"
            value={senderName}
            onChange={e => setSenderName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Template mode — single static template, no selector */}
        {mode === 'template' && (
          <div className="space-y-3">
            {/* HR / HM edit toggle */}
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground flex-1">Edit the template — <code className="text-[10px] bg-muted px-1 rounded">{'{{'}</code>firstName<code className="text-[10px] bg-muted px-1 rounded">{'}}'}</code>, <code className="text-[10px] bg-muted px-1 rounded">{'{{'}</code>company<code className="text-[10px] bg-muted px-1 rounded">{'}}'}</code>, <code className="text-[10px] bg-muted px-1 rounded">{'{{'}</code>senderName<code className="text-[10px] bg-muted px-1 rounded">{'}}'}</code> will be substituted.</p>
              <div className="flex items-center gap-2 text-xs">
                <span className={previewType === 'HR' ? 'font-semibold text-blue-600' : 'text-muted-foreground'}>HR</span>
                <button
                  type="button"
                  onClick={() => setPreviewType(p => p === 'HR' ? 'HM' : 'HR')}
                  className={`relative w-9 h-5 rounded-full transition-colors ${previewType === 'HM' ? 'bg-purple-500' : 'bg-blue-500'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${previewType === 'HM' ? 'translate-x-4' : ''}`} />
                </button>
                <span className={previewType === 'HM' ? 'font-semibold text-purple-600' : 'text-muted-foreground'}>HM</span>
              </div>
            </div>

            {/* Editable HR template */}
            {previewType === 'HR' && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">HR Template</p>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Subject</label>
                  <Input
                    value={hrSubject}
                    onChange={e => setHrSubject(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Body</label>
                  <Textarea
                    value={hrBody}
                    onChange={e => setHrBody(e.target.value)}
                    rows={10}
                    className="text-xs resize-none font-mono"
                  />
                </div>
              </div>
            )}

            {/* Editable HM template */}
            {previewType === 'HM' && (
              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">Hiring Manager Template</p>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Subject</label>
                  <Input
                    value={hmSubject}
                    onChange={e => setHmSubject(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Body</label>
                  <Textarea
                    value={hmBody}
                    onChange={e => setHmBody(e.target.value)}
                    rows={10}
                    className="text-xs resize-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* JD mode */}
        {mode === 'jd' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Job Description <span className="text-destructive">*</span></label>
              <Textarea
                placeholder="Paste the job description here. Gemini will write personalized emails referencing specific details from it..."
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                rows={6}
                className="text-xs resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Tone</label>
              <div className="flex gap-2">
                {(['professional', 'friendly', 'casual'] as EmailTone[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all ${tone === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-muted-foreground'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
