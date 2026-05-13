'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { apolloSearchByDomain, normalizeDomain, isValidDomain } from '@/lib/api-clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  Loader2,
  Search,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Settings2,
} from 'lucide-react';

export function SearchProspectsForm() {
  const settings = useStore(state => state.settings);
  const setSettings = useStore(state => state.setSettings);
  const setSearchResults = useStore(state => state.setSearchResults);
  const setSearchLoading = useStore(state => state.setSearchLoading);
  const setSearchError = useStore(state => state.setSearchError);
  const addToast = useStore(state => state.addToast);
  const clearSelection = useStore(state => state.clearSelection);

  const [websiteInput, setWebsiteInput] = useState('');
  const [domainError, setDomainError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTitles, setShowTitles] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const personTitles = settings.personTitles || [];

  const validateAndNormalize = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) {
      setDomainError('Please enter a company website');
      return null;
    }

    // Auto-fix: if user typed just "stripe" without dot, flag it
    const normalized = normalizeDomain(trimmed);
    if (!isValidDomain(normalized)) {
      setDomainError('Please enter a valid domain (e.g. stripe.com or https://stripe.com)');
      return null;
    }

    setDomainError('');
    return normalized;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = validateAndNormalize(websiteInput);
    if (!domain) return;

    if (!settings.apolloApiKey) {
      addToast('Add your Apollo API key in Settings first', 'warning');
      return;
    }

    setLoading(true);
    setSearchLoading(true);
    setSearchError(undefined);
    clearSelection();

    try {
      const results = await apolloSearchByDomain(domain, settings.apolloApiKey, personTitles);
      setSearchResults(results);
      addToast(
        results.length > 0
          ? `Found ${results.length} people at ${domain}`
          : `No matching people found at ${domain}`,
        results.length > 0 ? 'success' : 'info'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Search failed';
      setSearchError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleAddTitle = () => {
    const trimmed = newTitle.trim();
    if (!trimmed || personTitles.includes(trimmed)) return;
    setSettings({ personTitles: [...personTitles, trimmed] });
    setNewTitle('');
  };

  const handleRemoveTitle = (title: string) => {
    setSettings({ personTitles: personTitles.filter(t => t !== title) });
  };

  return (
    <div className="space-y-3">
      {/* Main search row */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 space-y-1">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              id="website-url"
              placeholder="stripe.com  or  https://figma.com"
              value={websiteInput}
              onChange={e => {
                setWebsiteInput(e.target.value);
                if (domainError) setDomainError('');
              }}
              disabled={loading}
              className={`pl-9 ${domainError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
          </div>
          {domainError && (
            <p className="text-xs text-destructive px-1">{domainError}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || !websiteInput.trim()}
          className="gap-2 shrink-0 w-full sm:w-auto"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Searching...</>
          ) : (
            <><Search className="w-4 h-4" />Find People</>
          )}
        </Button>
      </form>

      {/* Person titles filter toggle */}
      <button
        type="button"
        onClick={() => setShowTitles(v => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings2 className="w-3.5 h-3.5" />
        Filter by job titles ({personTitles.length})
        {showTitles ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showTitles && (
        <div className="bg-muted/40 rounded-lg p-3 space-y-3 border border-border">
          <p className="text-xs text-muted-foreground">
            Only people whose title contains one of these keywords will be returned.
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {personTitles.map(title => (
              <Badge
                key={title}
                variant="secondary"
                className="gap-1 text-xs pr-1 cursor-default"
              >
                {title}
                <button
                  onClick={() => handleRemoveTitle(title)}
                  className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                  aria-label={`Remove ${title}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
            {personTitles.length === 0 && (
              <span className="text-xs text-muted-foreground italic">No filters — add some below</span>
            )}
          </div>

          {/* Add new title */}
          <div className="flex gap-2">
            <Input
              placeholder="e.g. engineering manager"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTitle(); } }}
              className="h-7 text-xs"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddTitle}
              disabled={!newTitle.trim()}
              className="h-7 px-2 gap-1 text-xs shrink-0"
            >
              <Plus className="w-3 h-3" />
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
