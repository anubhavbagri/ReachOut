'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { normalizeDomain, isValidDomain } from '@/lib/api-clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Globe, Loader2, Search, X, Plus, ChevronDown, ChevronUp, Settings2,
} from 'lucide-react';

export function SearchProspectsForm() {
  const prefs = useStore(s => s.prefs);
  const setPrefs = useStore(s => s.setPrefs);
  const setSearchResults = useStore(s => s.setSearchResults);
  const setSearchLoading = useStore(s => s.setSearchLoading);
  const setSearchError = useStore(s => s.setSearchError);
  const addToast = useStore(s => s.addToast);

  const [websiteInput, setWebsiteInput] = useState('');
  const [domainError, setDomainError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTitles, setShowTitles] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const personTitles = prefs.personTitles ?? [];

  const validate = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) { setDomainError('Please enter a company website'); return null; }
    const normalized = normalizeDomain(trimmed);
    if (!isValidDomain(normalized)) {
      setDomainError('Enter a valid domain (e.g. stripe.com)'); return null;
    }
    setDomainError(''); return normalized;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = validate(websiteInput);
    if (!domain) return;

    setLoading(true);
    setSearchLoading(true);
    setSearchError(undefined);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, personTitles }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Search failed');
      setSearchResults(json.data);
      addToast(json.data.length > 0 ? `Found ${json.data.length} people at ${domain}` : `No results at ${domain}`, json.data.length > 0 ? 'success' : 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Search failed';
      setSearchError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 space-y-1">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="stripe.com  or  https://figma.com"
              value={websiteInput}
              onChange={e => { setWebsiteInput(e.target.value); if (domainError) setDomainError(''); }}
              disabled={loading}
              className={`pl-9 ${domainError ? 'border-destructive' : ''}`}
            />
          </div>
          {domainError && <p className="text-xs text-destructive px-1">{domainError}</p>}
        </div>
        <Button type="submit" disabled={loading || !websiteInput.trim()} className="gap-2 shrink-0 w-full sm:w-auto">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Searching...</> : <><Search className="w-4 h-4" />Find People</>}
        </Button>
      </form>

      <button type="button" onClick={() => setShowTitles(v => !v)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <Settings2 className="w-3.5 h-3.5" />
        Job title filters ({personTitles.length})
        {showTitles ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showTitles && (
        <div className="bg-muted/40 rounded-lg p-3 space-y-3 border border-border">
          <div className="flex flex-wrap gap-1.5">
            {personTitles.map(title => (
              <Badge key={title} variant="secondary" className="gap-1 text-xs pr-1">
                {title}
                <button onClick={() => setPrefs({ personTitles: personTitles.filter(t => t !== title) })} className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="e.g. engineering manager" value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newTitle.trim()) { setPrefs({ personTitles: [...personTitles, newTitle.trim()] }); setNewTitle(''); } } }}
              className="h-7 text-xs" />
            <Button type="button" size="sm" variant="outline"
              onClick={() => { if (newTitle.trim()) { setPrefs({ personTitles: [...personTitles, newTitle.trim()] }); setNewTitle(''); } }}
              disabled={!newTitle.trim()} className="h-7 px-2 gap-1 text-xs shrink-0">
              <Plus className="w-3 h-3" />Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
