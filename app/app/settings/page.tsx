'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Save, Key, Shield, Mail } from 'lucide-react';
import { GmailCallbackHandler } from '@/components/gmail-callback-handler';

export default function SettingsPage() {
  const settings = useStore(state => state.settings);
  const setSettings = useStore(state => state.setSettings);
  const gmailAuth = useStore(state => state.gmailAuth);
  const addToast = useStore(state => state.addToast);
  const [saved, setSaved] = useState(false);

  const [apolloEmail, setApolloEmail] = useState(settings.apolloEmail || '');
  const [apolloPassword, setApolloPassword] = useState(settings.apolloPassword || '');
  const [hunterKey, setHunterKey] = useState(settings.hunterApiKey || '');
  const [openaiKey, setOpenaiKey] = useState(settings.openaiApiKey || '');

  const handleSaveAPI = () => {
    setSettings({
      apolloEmail: apolloEmail,
      apolloPassword: apolloPassword,
      hunterApiKey: hunterKey,
      openaiApiKey: openaiKey,
    });
    setSaved(true);
    addToast('Credentials saved', 'success');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleConnectGmail = async () => {
    try {
      // Redirect to OAuth flow
      window.location.href = '/api/auth/gmail';
    } catch (error) {
      console.error('[v0] Gmail OAuth error:', error);
      addToast('Failed to connect Gmail', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Handle Gmail OAuth callback */}
      <Suspense fallback={null}>
        <GmailCallbackHandler />
      </Suspense>
      <div className="border-b border-border bg-card/50 p-6 space-y-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure API keys and integrations
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6 max-w-3xl">
        {/* API Keys Section */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">API Keys</h2>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Apollo.io Email</FieldLabel>
              <Input
                type="email"
                placeholder="your@email.com"
                value={apolloEmail}
                onChange={e => setApolloEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your Apollo.io account email address
              </p>
            </Field>

            <Field>
              <FieldLabel>Apollo.io Password</FieldLabel>
              <Input
                type="password"
                placeholder="Your Apollo.io password"
                value={apolloPassword}
                onChange={e => setApolloPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to use demo data. Never stored, only used for API authentication.
              </p>
            </Field>

            <Field>
              <FieldLabel>Hunter.io API Key (optional)</FieldLabel>
              <Input
                type="password"
                placeholder="Leave blank to use demo data"
                value={hunterKey}
                onChange={e => setHunterKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your key from <a href="https://hunter.io/account" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">hunter.io account</a>
              </p>
            </Field>

            <Field>
              <FieldLabel>OpenAI API Key (optional)</FieldLabel>
              <Input
                type="password"
                placeholder="Leave blank to use Gemini or demo"
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your key from <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI dashboard</a>
              </p>
            </Field>
          </FieldGroup>

          <Button
            onClick={handleSaveAPI}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save API Keys'}
          </Button>
        </Card>

        {/* Gmail Integration */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Gmail Integration</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <h3 className="font-medium">Gmail Account</h3>
                <p className="text-sm text-muted-foreground">
                  {gmailAuth.isAuthenticated ? gmailAuth.userEmail : 'Not connected'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleConnectGmail}
              >
                {gmailAuth.isAuthenticated ? 'Change Account' : 'Connect Gmail'}
              </Button>
            </div>

            {!gmailAuth.isAuthenticated && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                <p className="font-medium mb-2">How to authenticate:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click "Connect Gmail" above</li>
                  <li>Sign in with your Google account</li>
                  <li>Grant permission to send emails</li>
                </ol>
              </div>
            )}
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Preferences</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <h3 className="font-medium">Demo Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Use sample data instead of real API calls
                </p>
              </div>
              <Switch
                checked={settings.demoMode}
                onCheckedChange={(checked) => setSettings({ demoMode: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <h3 className="font-medium">Email Delay (ms)</h3>
                <p className="text-sm text-muted-foreground">
                  Delay between sending emails for rate limiting
                </p>
              </div>
              <Input
                type="number"
                value={settings.emailDelayMs}
                onChange={e => setSettings({ emailDelayMs: parseInt(e.target.value) })}
                className="w-24"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
