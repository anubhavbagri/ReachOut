'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  COLD_EMAIL_TEMPLATES,
  applyTemplate,
  EmailTemplate,
} from '@/lib/email-templates';
import {
  generateEmail,
  generateEmailFromDomain,
  generateEmailFromJobDescription,
  personalizeEmail,
  EmailTone,
} from '@/lib/email-generator';
import {
  Upload,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Wand2,
  FileText,
  Globe,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';

export interface ManualContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  website?: string;
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
}

type GenerationMode = 'template' | 'domain' | 'jd';

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function parseCSVRow(row: string): string[] {
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

function parseContacts(raw: string): ManualContact[] {
  const lines = raw.trim().split('\n').filter(l => l.trim());
  const contacts: ManualContact[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cols = parseCSVRow(lines[i]);
    // Skip header row
    if (i === 0 && (cols[0].toLowerCase().includes('name') || cols[0].toLowerCase() === 'first')) continue;

    // Support: firstName, lastName, email, company, title, website
    // Also support: fullName, email, company, title
    if (cols.length < 3) continue;

    let firstName = '', lastName = '', email = '', company = '', title = '', website = '';

    if (cols.length >= 6) {
      [firstName, lastName, email, company, title, website] = cols;
    } else if (cols.length >= 5) {
      [firstName, lastName, email, company, title] = cols;
    } else if (cols.length >= 4) {
      // Could be fullName, email, company, title
      const nameParts = cols[0].split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
      email = cols[1];
      company = cols[2];
      title = cols[3] || '';
    } else {
      // fullName, email, company
      const nameParts = cols[0].split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
      email = cols[1];
      company = cols[2];
    }

    if (!email || !email.includes('@')) continue;

    contacts.push({
      id: `manual-${Date.now()}-${i}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      company: company.trim(),
      title: title.trim(),
      website: website.trim(),
    });
  }
  return contacts;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ManualSendForm({ onEmailsReady }: ManualSendFormProps) {
  const addToast = useStore(s => s.addToast);

  // Contacts
  const [contacts, setContacts] = useState<ManualContact[]>([]);
  const [csvText, setCsvText] = useState('');
  const [showCsvInput, setShowCsvInput] = useState(true);
  const [parseError, setParseError] = useState('');

  // Manual row add
  const [newRow, setNewRow] = useState({ firstName: '', lastName: '', email: '', company: '', title: '', website: '' });

  // Generation mode
  const [mode, setMode] = useState<GenerationMode>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(COLD_EMAIL_TEMPLATES[0]);
  const [senderName, setSenderName] = useState('');
  const [tone, setTone] = useState<EmailTone>('professional');
  const [domainContext, setDomainContext] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // Generating
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Contact parsing ────────────────────────────────────────────────────────

  const handlePasteContacts = () => {
    setParseError('');
    if (!csvText.trim()) return;
    const parsed = parseContacts(csvText);
    if (parsed.length === 0) {
      setParseError('Could not parse any contacts. Check the format below.');
      return;
    }
    setContacts(prev => {
      const existingEmails = new Set(prev.map(c => c.email));
      return [...prev, ...parsed.filter(c => !existingEmails.has(c.email))];
    });
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
      const parsed = parseContacts(text);
      if (parsed.length === 0) {
        setParseError('Could not parse CSV file. Check the format.');
        return;
      }
      setContacts(prev => {
        const existingEmails = new Set(prev.map(c => c.email));
        return [...prev, ...parsed.filter(c => !existingEmails.has(c.email))];
      });
      addToast(`Imported ${parsed.length} contacts from CSV`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddRow = () => {
    if (!newRow.email.includes('@') || !newRow.firstName) return;
    setContacts(prev => [...prev, { ...newRow, id: `manual-${Date.now()}` }]);
    setNewRow({ firstName: '', lastName: '', email: '', company: '', title: '', website: '' });
  };

  const handleRemoveContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
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
      const prospect = {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        company: c.company,
        title: c.title,
        website: c.website,
      };

      try {
        let generated: { subject: string; body: string };

        if (mode === 'template') {
          // Apply template substitution
          const vars: Record<string, string> = {
            firstName: c.firstName,
            lastName: c.lastName,
            company: c.company,
            title: c.title,
            senderName: senderName || '[Your name]',
          };
          generated = {
            subject: applyTemplate(selectedTemplate.subject, vars),
            body: applyTemplate(selectedTemplate.body, vars),
          };
        } else if (mode === 'domain') {
          const domain = (c.website || c.company)
            .replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          generated = await generateEmailFromDomain(prospect, domain, tone);
          // Inject sender name
          if (senderName) {
            generated.body = generated.body.replace(/\[your name\]/i, senderName);
          }
        } else {
          // JD mode
          generated = await generateEmailFromJobDescription(prospect, jobDescription, tone);
          if (senderName) {
            generated.body = generated.body.replace(/\[your name\]/i, senderName);
          }
        }

        emails.push({
          prospectId: c.id,
          prospectName: `${c.firstName} ${c.lastName}`,
          prospectEmail: c.email,
          prospectCompany: c.company,
          prospectTitle: c.title,
          subject: generated.subject,
          body: generated.body,
        });
      } catch (err) {
        console.error(`Failed for ${c.email}:`, err);
        // Add template fallback
        emails.push({
          prospectId: c.id,
          prospectName: `${c.firstName} ${c.lastName}`,
          prospectEmail: c.email,
          prospectCompany: c.company,
          prospectTitle: c.title,
          subject: `Exploring opportunities at ${c.company}`,
          body: `Hi ${c.firstName},\n\nI'd love to learn more about opportunities at ${c.company}.\n\nWould you have 15 minutes for a quick chat?\n\nBest,\n${senderName || '[Your name]'}`,
        });
      }

      setProgress(i + 1);
      if (i < contacts.length - 1 && mode !== 'template') {
        await delay(700); // Rate limit AI calls
      }
    }

    setGenerating(false);
    onEmailsReady(emails);
    addToast(`Generated ${emails.length} emails — review before sending`, 'success');
  };

  const needsGemini = mode === 'domain' || mode === 'jd';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Step 1: Add Contacts */}
      <Card className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base">Step 1 — Add Contacts</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Paste CSV, upload a file, or add manually</p>
          </div>
          {contacts.length > 0 && (
            <Badge variant="secondary">{contacts.length} contacts</Badge>
          )}
        </div>

        {/* CSV paste area */}
        <div className="space-y-2">
          <button
            onClick={() => setShowCsvInput(v => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {showCsvInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Paste CSV / list
          </button>

          {showCsvInput && (
            <div className="space-y-2">
              <Textarea
                placeholder={`Paste contacts here. Supported formats:\n\nfirstName, lastName, email, company, title, website\nJohn, Smith, john@stripe.com, Stripe, Recruiter, stripe.com\n\nOR: Full Name, email, company, title\nJohn Smith, john@stripe.com, Stripe, Recruiter`}
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
            <Input placeholder="First name *" value={newRow.firstName} onChange={e => setNewRow(p => ({ ...p, firstName: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder="Last name" value={newRow.lastName} onChange={e => setNewRow(p => ({ ...p, lastName: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder="Email *" type="email" value={newRow.email} onChange={e => setNewRow(p => ({ ...p, email: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder="Company" value={newRow.company} onChange={e => setNewRow(p => ({ ...p, company: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder="Title" value={newRow.title} onChange={e => setNewRow(p => ({ ...p, title: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder="Website (for AI mode)" value={newRow.website} onChange={e => setNewRow(p => ({ ...p, website: e.target.value }))} className="h-8 text-xs" />
          </div>
          <Button size="sm" variant="outline" onClick={handleAddRow} disabled={!newRow.firstName || !newRow.email.includes('@')} className="gap-1.5 h-8 text-xs">
            <Plus className="w-3 h-3" /> Add Contact
          </Button>
        </div>

        {/* Contact list */}
        {contacts.length > 0 && (
          <div className="border-t border-border pt-3 space-y-1.5 max-h-52 overflow-y-auto">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-muted group">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{c.firstName} {c.lastName}</span>
                  <span className="text-muted-foreground"> · {c.email}</span>
                  {c.company && <span className="text-muted-foreground"> · {c.company}</span>}
                </div>
                <button onClick={() => handleRemoveContact(c.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Step 2: Email Content */}
      <Card className="p-4 md:p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-base">Step 2 — Email Content</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Choose how emails are generated</p>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'template', label: 'Template', icon: FileText, desc: 'Fast, variable substitution' },
            { id: 'domain', label: 'AI by Domain', icon: Globe, desc: 'Gemini researches company' },
            { id: 'jd', label: 'AI by JD', icon: Wand2, desc: 'Gemini tailors to job post' },
          ] as const).map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`p-3 rounded-lg border-2 text-left transition-all space-y-1 ${
                mode === id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
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

        {/* Sender name (all modes) */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Your name (replaces [Your name])</label>
          <Input
            placeholder="e.g. Anubhav Bagri"
            value={senderName}
            onChange={e => setSenderName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Template mode */}
        {mode === 'template' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Select Template</label>
              <div className="space-y-2">
                {COLD_EMAIL_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedTemplate.id === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {selectedTemplate.id === t.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                      <span className="text-sm font-medium">{t.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-5">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Template preview */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Preview (variables will be substituted)</p>
              <p className="text-xs font-semibold">Subject: {selectedTemplate.subject}</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {selectedTemplate.body}
              </pre>
            </div>
          </div>
        )}

        {/* Domain AI mode */}
        {mode === 'domain' && (
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">How it works</p>
              <p>Gemini uses the company&apos;s website/domain from each contact&apos;s record to research what the company does and write a relevant, personalized email. Make sure each contact has a website or company name filled in.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Tone</label>
              <div className="flex gap-2">
                {(['professional', 'friendly', 'casual'] as EmailTone[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all ${
                      tone === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

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
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all ${
                      tone === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-muted-foreground'
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

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={generating || contacts.length === 0 || (mode === 'jd' && !jobDescription.trim())}
        className="w-full gap-2"
        size="lg"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating {progress}/{contacts.length}...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Generate {contacts.length > 0 ? contacts.length : ''} Email{contacts.length !== 1 ? 's' : ''}
          </>
        )}
      </Button>

      {generating && (
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${contacts.length > 0 ? (progress / contacts.length) * 100 : 0}%` }}
          />
        </div>
      )}
    </div>
  );
}
