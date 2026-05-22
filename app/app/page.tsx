'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { SearchProspectsForm } from '@/components/search-form';
import { ProspectsGrid } from '@/components/prospects-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Mail, Trash2, Search, Loader2, CheckCircle2, Plus,
  Briefcase, Building2, EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import { dbInsertRevealedProspect } from '@/lib/supabase-db';

interface HunterResult {
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  company: string;
  domain: string;
  title: string | null;
  linkedin: string | null;
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function HunterResultCard({ result, onDismiss }: { result: HunterResult; onDismiss: () => void }) {
  const addToEmailList = useStore(s => s.addToEmailList);
  const removeFromEmailList = useStore(s => s.removeFromEmailList);
  const isInEmailList = useStore(s => s.isInEmailList);
  const addToast = useStore(s => s.addToast);

  const prospectId = `hunter-${result.email}`;
  const inList = isInEmailList(prospectId);
  const [recipientType, setRecipientType] = useState<'HR' | 'HM'>('HR');

  const handleToggle = () => {
    if (inList) {
      removeFromEmailList(prospectId);
      addToast('Removed from send list', 'info');
    } else {
      addToEmailList({
        prospectId,
        prospectName: result.name,
        prospectEmail: result.email,
        prospectCompany: result.company,
        prospectTitle: result.title || '',
        addedAt: new Date(),
        recipientType,
      });
      addToast('Added to send list', 'success');
    }
  };

  const isLastNameObfuscated = result.lastName?.includes('*');
  const linkedinSearchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(
    [result.firstName, isLastNameObfuscated ? '' : (result.lastName || ''), result.title || '', result.company]
      .filter(Boolean)
      .join(' ')
      .trim()
  )}`;

  return (
    <Card className={`flex flex-col p-4 gap-3 transition-all hover:shadow-md ${inList ? 'ring-2 ring-primary' : ''}`}>
      {/* Row 1: Name + badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-base leading-tight truncate">
            {result.name}
          </h3>
          {result.title && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
              <Briefcase className="w-3 h-3 shrink-0" />
              <span className="truncate">{result.title}</span>
            </p>
          )}
          <p className="text-sm text-primary font-medium flex items-center gap-1 truncate">
            <Building2 className="w-3 h-3 shrink-0" />
            <a
              href={`https://${result.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:underline underline-offset-2"
            >
              {result.company || result.domain}
            </a>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={() => setRecipientType(prev => prev === 'HR' ? 'HM' : 'HR')}
            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors h-7 flex items-center justify-center ${
              recipientType === 'HR'
                ? 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
                : 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800'
            }`}
            title={`Click to toggle: ${recipientType === 'HR' ? 'Human Resources' : 'Hiring Manager'}`}
          >
            {recipientType}
          </button>
          <a
            href={linkedinSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-lg bg-[#0077b5]/10 flex items-center justify-center text-[#0077b5] hover:bg-[#0077b5]/20 transition-colors"
            title={`Search ${result.firstName} on LinkedIn`}
          >
            <LinkedInIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Email pill */}
      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
        <Mail className="w-3.5 h-3.5 text-green-600 shrink-0" />
        <span className="text-xs font-medium text-green-700 dark:text-green-400 truncate flex-1">
          {result.email}
        </span>
      </div>

      {/* Actions */}
      <Button
        size="sm"
        variant={inList ? 'default' : 'outline'}
        className="w-full h-8 text-xs gap-1.5"
        onClick={handleToggle}
      >
        {inList ? (
          <><CheckCircle2 className="w-3.5 h-3.5" />In send list</>
        ) : (
          <><Plus className="w-3.5 h-3.5" />Add to send list</>
        )}
      </Button>
    </Card>
  );
}

export default function SearchPage() {
  const search = useStore(state => state.search);
  const emailList = useStore(state => state.emailList);
  const clearEmailList = useStore(state => state.clearEmailList);
  const addToast = useStore(state => state.addToast);

  const [hunterFullName, setHunterFullName] = useState('');
  const [hunterDomain, setHunterDomain] = useState('');
  const [hunterLoading, setHunterLoading] = useState(false);
  const [hunterResult, setHunterResult] = useState<HunterResult | null>(null);

  // Clear hunter result when Apollo search starts
  useEffect(() => {
    if (search.loading) setHunterResult(null);
  }, [search.loading]);

  const handleHunterSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameParts = hunterFullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    if (!firstName || !hunterDomain.trim()) {
      addToast('Please enter a full name and company domain', 'info');
      return;
    }
    setHunterLoading(true);
    setHunterResult(null);
    try {
      const res = await fetch('/api/reveal/hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, website: hunterDomain.trim() }),
      });
      const data = await res.json();
      if (data.email) {
        const result: HunterResult = {
          email: data.email,
          firstName: data.firstName || firstName,
          lastName: data.lastName || lastName,
          name: `${data.firstName || firstName} ${data.lastName || lastName}`.trim(),
          company: data.company || hunterDomain.trim(),
          domain: data.domain || hunterDomain.trim(),
          title: data.title || null,
          linkedin: data.linkedin || null,
        };
        setHunterResult(result);

        // Save to revealed_prospects
        await dbInsertRevealedProspect({
          name: result.name,
          first_name: result.firstName,
          last_name: result.lastName,
          email: result.email,
          company: result.company,          // real company name from Hunter (e.g. 'Curefit')
          title: result.title || 'Recruiter', // default to Recruiter if blank
          source: 'hunter',
        } as any);

        addToast(`Found: ${data.email}`, 'success');
        setHunterFullName('');
        setHunterDomain('');
      } else {
        addToast(data.error || 'No email found for this person', 'info');
      }
    } catch {
      addToast('Hunter search failed', 'error');
    } finally {
      setHunterLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/30 p-4 md:p-6 space-y-5 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Find Prospects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Search a company to find hiring teams.
          </p>
        </div>

        {/* Equal-height cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Company Search Card */}
          <div className="bg-background border rounded-lg p-4 shadow-xs flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5 flex-wrap">
                Company Search
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">Apollo</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Enter a domain to find multiple people at a company.
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <SearchProspectsForm />
            </div>
          </div>

          {/* People Search Card */}
          <div className="bg-background border rounded-lg p-4 shadow-xs flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5 flex-wrap">
                People Search
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">Hunter</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Enter a person's full name and company domain to find their email.
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <form onSubmit={handleHunterSearch} className="space-y-2">
                <Input
                  placeholder="Full name (e.g. Jane Doe)"
                  value={hunterFullName}
                  onChange={e => setHunterFullName(e.target.value)}
                  disabled={hunterLoading}
                  className="text-sm bg-card"
                  autoComplete="off"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Domain (e.g. stripe.com)"
                    value={hunterDomain}
                    onChange={e => setHunterDomain(e.target.value)}
                    disabled={hunterLoading}
                    className="text-sm bg-card flex-1"
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    disabled={hunterLoading || !hunterFullName.trim() || !hunterDomain.trim()}
                    className="shrink-0 gap-1.5"
                  >
                    {hunterLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Find
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Email list action bar */}
      {emailList.length > 0 && (
        <div className="shrink-0 border-b border-border bg-primary/5 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">
            <span className="text-primary font-bold">{emailList.length}</span> people in send list
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearEmailList}
              className="gap-1.5 text-muted-foreground h-8 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </Button>
            <Link href="/app/send">
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Mail className="w-3.5 h-3.5" />
                Send Emails
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {search.loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground text-sm">Searching Apollo...</p>
            </div>
          </div>
        ) : search.results.length > 0 ? (
          <ProspectsGrid prospects={search.results} />
        ) : hunterResult ? (
          <div className="p-4 md:p-6 space-y-4">
            <p className="text-sm text-muted-foreground font-medium">Hunter result</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <HunterResultCard result={hunterResult} onDismiss={() => setHunterResult(null)} />
            </div>
          </div>
        ) : search.error ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center space-y-3 max-w-sm">
              <div className="text-4xl">⚠️</div>
              <h3 className="font-semibold">Search failed</h3>
              <p className="text-sm text-muted-foreground">{search.error}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center space-y-3 max-w-sm">
              <div className="text-5xl opacity-20">🔍</div>
              <div>
                <h3 className="text-lg font-semibold">Find hiring teams</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Enter a company website above to surface their recruiters and talent acquisition team
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
