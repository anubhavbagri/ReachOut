'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Zap } from 'lucide-react';

interface EmailGeneratorProps {
  prospectCount: number;
  onGenerate: (context: string, tone: 'professional' | 'friendly' | 'casual') => void;
  loading?: boolean;
}

export function EmailGenerator({
  prospectCount,
  onGenerate,
  loading = false,
}: EmailGeneratorProps) {
  const [context, setContext] = useState('');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'casual'>('professional');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (context.trim()) {
      onGenerate(context, tone);
    }
  };

  return (
    <Card className="p-4 md:p-8 max-w-2xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold">Generate Personalized Emails</h2>
        <p className="text-muted-foreground">
          Gemini will write personalized emails for all {prospectCount} people based on the context you provide.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FieldGroup>
          <Field>
            <FieldLabel>What are you offering? (Context)</FieldLabel>
            <Textarea
              placeholder="E.g., We help B2B SaaS companies reduce churn through better customer engagement. Our platform integrates with your existing CRM and uses AI to identify at-risk customers before they churn.

Include:
- What problem you solve
- Your unique approach
- Who you typically work with
- A specific insight or achievement"
              value={context}
              onChange={e => setContext(e.target.value)}
              disabled={loading}
              rows={6}
              className="resize-none"
            />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <Field>
            <FieldLabel>Email Tone</FieldLabel>
            <div className="grid grid-cols-3 gap-3">
              {(['professional', 'friendly', 'casual'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`p-3 rounded-lg border-2 transition-all text-center font-medium capitalize ${
                    tone === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  disabled={loading}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
        </FieldGroup>

        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium">What happens next:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ AI generates personalized emails for each prospect</li>
            <li>✓ Each email includes prospect-specific details (company, title, location)</li>
            <li>✓ You&apos;ll review all emails before sending</li>
            <li>✓ Send directly via Gmail with automatic rate limiting</li>
          </ul>
        </div>

        <Button
          type="submit"
          disabled={loading || !context.trim()}
          className="w-full gap-2"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating {prospectCount} emails...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate Emails
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
