'use client';

import { useState, Suspense } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { GmailCallbackHandler } from '@/components/gmail-callback-handler';
import {
  Save,
  Key,
  Mail,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Timer,
} from 'lucide-react';

export default function SettingsPage() {
  const settings = useStore(state => state.settings);
  const setSettings = useStore(state => state.setSettings);
  const gmailAuth = useStore(state => state.gmailAuth);
  const addToast = useStore(state => state.addToast);
  const [saved, setSaved] = useState(false);

  const [apolloKey, setApolloKey] = useState(settings.apolloApiKey || '');
  const [hunterKey, setHunterKey] = useState(settings.hunterApiKey || '');
  const [contactOutKey, setContactOutKey] = useState(settings.contactOutApiKey || '');
  const [geminiKey, setGeminiKey] = useState(settings.googleApiKey || settings.openaiApiKey || '');
  const [emailDelay, setEmailDelay] = useState(settings.emailDelayMs);

  const handleSave = () => {
    setSettings({
      apolloApiKey: apolloKey,
      hunterApiKey: hunterKey,
      contactOutApiKey: contactOutKey,
      googleApiKey: geminiKey,
      emailDelayMs: emailDelay,
    });
    setSaved(true);
    addToast('Settings saved', 'success');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleConnectGmail = () => {
    window.location.href = '/api/auth/gmail';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Handle Gmail OAuth callback */}
      <Suspense fallback={null}>
        <GmailCallbackHandler />
      </Suspense>

      <div className="border-b border-border bg-card/50 p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure API keys and integrations
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-3xl w-full">

        {/* Gmail Integration — most important, so first */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Gmail Integration</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <h3 className="font-medium">Gmail Account</h3>
              <p className="text-sm text-muted-foreground">
                {gmailAuth.isAuthenticated
                  ? (
                    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {gmailAuth.userEmail}
                    </span>
                  )
                  : 'Not connected'}
              </p>
            </div>
            <Button variant={gmailAuth.isAuthenticated ? 'outline' : 'default'} onClick={handleConnectGmail} className="gap-2">
              {gmailAuth.isAuthenticated ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Switch Account
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Connect Gmail
                </>
              )}
            </Button>
          </div>

          {!gmailAuth.isAuthenticated && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg space-y-3">
              <p className="font-medium text-blue-800 dark:text-blue-300">Setup required (one-time):</p>
              <ol className="list-decimal list-inside space-y-1.5 text-blue-700 dark:text-blue-400">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="w-3 h-3" /></a> → create a project</li>
                <li>Enable <strong>Gmail API</strong> for the project</li>
                <li>Create OAuth 2.0 credentials (Web app type)</li>
                <li>Add <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">{typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.vercel.app'}/api/auth/gmail?action=callback</code> as redirect URI</li>
                <li>Add <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">GOOGLE_CLIENT_ID</code> and <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded text-xs">GOOGLE_CLIENT_SECRET</code> to Vercel env vars</li>
                <li>Click <strong>Connect Gmail</strong> above to authorize</li>
              </ol>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                ✓ Emails will be sent directly from your personal Gmail account — no third-party servers involved.
              </p>
            </div>
          )}
        </Card>

        {/* Prospect API Keys */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Prospect API Keys</h2>
              <p className="text-sm text-muted-foreground">Used to find recruiters and reveal email addresses</p>
            </div>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Apollo.io API Key <span className="text-destructive">*</span></FieldLabel>
              <Input
                type="password"
                placeholder="api_key_..."
                value={apolloKey}
                onChange={e => setApolloKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Required for prospect search. Get from{' '}
                <a href="https://app.apollo.io/#/settings/integrations/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  Apollo Settings → API <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </Field>

            <Field>
              <FieldLabel>
                Hunter.io API Key{' '}
                <span className="text-xs text-muted-foreground font-normal">(optional fallback)</span>
              </FieldLabel>
              <Input
                type="password"
                placeholder="hnt_..."
                value={hunterKey}
                onChange={e => setHunterKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Shows a separate "Find Email (Hunter)" button on each prospect card.{' '}
                <a href="https://hunter.io/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  Get key <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </Field>

            <Field>
              <FieldLabel>
                ContactOut API Key{' '}
                <span className="text-xs text-muted-foreground font-normal">(optional fallback)</span>
              </FieldLabel>
              <Input
                type="password"
                placeholder="co_..."
                value={contactOutKey}
                onChange={e => setContactOutKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Shows a separate "Find Email (ContactOut)" button on each prospect card (requires LinkedIn URL).{' '}
                <a href="https://contactout.com/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  Get key <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </Field>
          </FieldGroup>
        </Card>

        {/* AI Keys */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-xl font-bold">AI Email Generation (Gemini)</h2>
              <p className="text-sm text-muted-foreground">Used by Manual Send and Compose to write personalized emails</p>
            </div>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Google Gemini API Key <span className="text-destructive">*</span></FieldLabel>
              <Input
                type="password"
                placeholder="AIza..."
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used for AI email generation (Manual Send and Compose modes).{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                  Get from Google AI Studio <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </Field>
          </FieldGroup>
        </Card>

        {/* Email Preferences */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-secondary" />
            <div>
              <h2 className="text-xl font-bold">Send Preferences</h2>
              <p className="text-sm text-muted-foreground">Rate limiting for bulk sends</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-medium">Delay Between Emails</h3>
              <p className="text-sm text-muted-foreground">Milliseconds to wait between each email send</p>
            </div>
            <Input
              type="number"
              min={500}
              max={30000}
              step={500}
              value={emailDelay}
              onChange={e => setEmailDelay(parseInt(e.target.value))}
              className="w-28"
            />
          </div>
        </Card>

        <Button onClick={handleSave} className="gap-2 w-full sm:w-auto">
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
