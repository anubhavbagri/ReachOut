'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { searchProspectsWithFallback, demoSearch } from '@/lib/api-clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Search, Loader2 } from 'lucide-react';

export function SearchProspectsForm() {
  const [keywords, setKeywords] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);

  const setSearchResults = useStore(state => state.setSearchResults);
  const setSearchLoading = useStore(state => state.setSearchLoading);
  const setSearchError = useStore(state => state.setSearchError);
  const addToast = useStore(state => state.addToast);
  const settings = useStore(state => state.settings);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keywords.trim() && !title.trim() && !company.trim()) {
      addToast('Please enter at least one search term', 'warning');
      return;
    }

    setLoading(true);
    setSearchLoading(true);
    setSearchError(undefined);

    try {
      const keywordArray = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const results = await demoSearch({
        keywords: keywordArray || [],
        title: title || undefined,
        company: company || undefined,
        limit: 20,
      });

      setSearchResults(results);
      addToast(`Found ${results.length} prospects`, 'success');
    } catch (error) {
      console.error('[v0] Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      addToast('Failed to search prospects', 'error');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <FieldGroup>
        <Field>
          <FieldLabel>Keywords</FieldLabel>
          <Input
            placeholder="e.g., SaaS, B2B, startup (comma-separated)"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            disabled={loading}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Job Title (optional)</FieldLabel>
            <Input
              placeholder="e.g., VP Product, CTO"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={loading}
            />
          </Field>

          <Field>
            <FieldLabel>Company (optional)</FieldLabel>
            <Input
              placeholder="e.g., Stripe, Figma"
              value={company}
              onChange={e => setCompany(e.target.value)}
              disabled={loading}
            />
          </Field>
        </div>
      </FieldGroup>

      <Button
        type="submit"
        disabled={loading}
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Search Prospects
          </>
        )}
      </Button>

      {settings.demoMode && (
        <p className="text-xs text-muted-foreground text-center">
          Demo mode enabled - using sample data
        </p>
      )}
    </form>
  );
}
