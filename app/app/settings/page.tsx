'use client';

import { useState, Suspense, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { GmailCallbackHandler } from '@/components/gmail-callback-handler';
import { dbGetConfig, dbDeleteConfig } from '@/lib/supabase-db';
import {
  Mail, CheckCircle2, ExternalLink, LogOut, Timer, Save,
  Key, RefreshCw, User, FileText, Link as LinkIcon,
} from 'lucide-react';


export default function SettingsPage() {
  const prefs = useStore(s => s.prefs);
  const setPrefs = useStore(s => s.setPrefs);
  const gmailConnected = useStore(s => s.gmailConnected);
  const gmailUserEmail = useStore(s => s.gmailUserEmail);
  const setGmailState = useStore(s => s.setGmailState);
  const addToast = useStore(s => s.addToast);

  const [delayMs, setDelayMs] = useState(prefs.emailDelayMs);
  const [senderName, setSenderName] = useState(prefs.senderName || '');
  const [linkedinUrl, setLinkedinUrl] = useState(prefs.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(prefs.githubUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(prefs.portfolioUrl || '');
  const [resumeUrl, setResumeUrl] = useState(prefs.resumeUrl || '');
  const [saved, setSaved] = useState(false);
  const [loadingGmail, setLoadingGmail] = useState(false);

  // On mount, check Supabase for Gmail connection state
  useEffect(() => {
    dbGetConfig('gmail_user_email').then(email => {
      if (email) setGmailState(email, true);
    });
  }, [setGmailState]);

  const handleSave = () => {
    setPrefs({
      emailDelayMs: delayMs,
      senderName,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      resumeUrl,
    });
    setSaved(true);
    addToast('Preferences saved', 'success');
    setTimeout(() => setSaved(false), 2500);
  };

  const handleConnectGmail = () => {
    setLoadingGmail(true);
    window.location.href = '/api/auth/gmail';
  };

  const handleDisconnectGmail = async () => {
    await dbDeleteConfig('gmail_refresh_token');
    await dbDeleteConfig('gmail_user_email');
    setGmailState('', false);
    addToast('Gmail disconnected', 'info');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col h-full">
      <Suspense fallback={null}><GmailCallbackHandler /></Suspense>

      {/* Header */}
      <div className="border-b border-border bg-card/50 px-4 py-4 md:px-6 md:py-5 shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Gmail connection and send preferences</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* ── Gmail Account ─────────────────────────────────────── */}
          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Gmail Account</h2>
                <p className="text-xs text-muted-foreground">Used to send all outreach emails</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {gmailConnected ? (
                <div className="space-y-3">
                  {/* Connected badge */}
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'oklch(0.96 0.04 160)', border: '1px solid oklch(0.85 0.08 155)' }}>
                    <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'oklch(0.50 0.14 155)' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'oklch(0.35 0.12 155)' }}>Connected</p>
                      <p className="text-xs truncate" style={{ color: 'oklch(0.50 0.1 155)' }}>{gmailUserEmail}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleDisconnectGmail}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-border hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect Gmail
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Info box */}
                  <div className="rounded-xl p-4 space-y-1"
                    style={{ background: 'oklch(0.96 0.015 65)', border: '1px solid oklch(0.88 0.025 60)' }}>
                    <p className="text-sm font-medium">One-time setup</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Connects your personal Gmail via OAuth. The refresh token is stored securely in Supabase — no re-auth needed on new devices.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleConnectGmail}
                      disabled={loadingGmail}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold clay-shadow transition-all disabled:opacity-60"
                      style={{ background: 'oklch(0.58 0.2 25)', color: 'oklch(0.98 0.01 70)' }}
                    >
                      {loadingGmail
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Redirecting…</>
                        : <><Mail className="w-4 h-4" /> Connect Gmail</>
                      }
                    </button>

                    <a
                      href="https://console.cloud.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors text-muted-foreground"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Google Cloud Console
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Send Preferences ───────────────────────────────────── */}
          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
              <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0">
                <Timer className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Send Preferences</h2>
                <p className="text-xs text-muted-foreground">Personalization and rate limiting</p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Sender name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Your name (used in email templates)
                </label>
                <Input
                  placeholder="e.g. Anubhav Bagri"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Delay */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                  Delay between bulk emails (ms)
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={500}
                    max={30000}
                    step={500}
                    value={delayMs}
                    onChange={e => setDelayMs(parseInt(e.target.value))}
                    className="h-10 w-28 tabular-nums"
                  />
                  <div className="flex gap-2">
                    {[1000, 1500, 2000, 3000].map(v => (
                      <button
                        key={v}
                        onClick={() => setDelayMs(v)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          delayMs === v
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {v}ms
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Minimum 1000ms recommended to avoid Gmail rate limits</p>
              </div>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold clay-shadow transition-all"
                style={saved
                  ? { background: 'oklch(0.68 0.08 160)', color: 'oklch(0.98 0.01 70)' }
                  : { background: 'oklch(0.58 0.2 25)', color: 'oklch(0.98 0.01 70)' }
                }
              >
                {saved
                  ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                  : <><Save className="w-4 h-4" /> Save Preferences</>
                }
              </button>
            </div>
          </section>

          {/* ── Profile & Resume ─────────────────────────────────────── */}
          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Profile & Resume</h2>
                <p className="text-xs text-muted-foreground">Links substituted into outreach templates</p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Codebase resume info */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-500/5">
                <FileText className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-purple-800 dark:text-purple-300">Resume stored in codebase</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Place your PDF as <code className="bg-muted px-1 py-0.5 rounded text-[10px]">public/resume.pdf</code> in the project root. It will be attached automatically when sending to Hiring Managers — works across all sessions and browsers.
                  </p>
                </div>
              </div>

              {/* Profile links grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    LinkedIn URL
                  </label>
                  <Input
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={e => setLinkedinUrl(e.target.value)}
                    className="h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    GitHub URL
                  </label>
                  <Input
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    className="h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    Portfolio/Website URL
                  </label>
                  <Input
                    placeholder="https://yourportfolio.com"
                    value={portfolioUrl}
                    onChange={e => setPortfolioUrl(e.target.value)}
                    className="h-10 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    Resume Link (Google Drive / Notion)
                  </label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={resumeUrl}
                    onChange={e => setResumeUrl(e.target.value)}
                    className="h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold clay-shadow transition-all"
                style={saved
                  ? { background: 'oklch(0.68 0.08 160)', color: 'oklch(0.98 0.01 70)' }
                  : { background: 'oklch(0.58 0.2 25)', color: 'oklch(0.98 0.01 70)' }
                }
              >
                {saved
                  ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                  : <><Save className="w-4 h-4" /> Save Preferences</>
                }
              </button>
            </div>
          </section>

          {/* ── API Keys info ──────────────────────────────────────── */}
          <section className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-4 flex gap-3">
            <Key className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">API Keys are configured as environment variables</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Apollo, Hunter, ContactOut, Gemini, and Google OAuth keys are set in Vercel → Settings → Environment Variables. See{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-[11px]">.env.example</code>{' '}
                for the full list.
              </p>
            </div>
          </section>

          {/* ── Logout ────────────────────────────────────────────── */}
          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Session</h2>
                <p className="text-xs text-muted-foreground">You are logged in to ReachOut</p>
              </div>
            </div>
            <div className="p-5">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border transition-colors hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
