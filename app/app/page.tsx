'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { SearchProspectsForm } from '@/components/search-form';
import { ProspectsGrid } from '@/components/prospects-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Trash2, Loader2, Search } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
  const search = useStore(state => state.search);
  const emailList = useStore(state => state.emailList);
  const clearEmailList = useStore(state => state.clearEmailList);
  const addToEmailList = useStore(state => state.addToEmailList);
  const addToast = useStore(state => state.addToast);

  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  const handleLinkedinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl.trim()) return;
    
    setLinkedinLoading(true);
    try {
      const res = await fetch('/api/reveal/contactout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedinUrl: linkedinUrl.trim() }),
      });
      const data = await res.json();
      
      if (data.email) {
        addToEmailList({
          prospectId: `manual-co-${Date.now()}`,
          prospectName: data.profile?.first_name 
            ? `${data.profile.first_name} ${data.profile.last_name || ''}`.trim()
            : 'LinkedIn Contact',
          prospectEmail: data.email,
          prospectCompany: data.profile?.company || 'Unknown Company',
          prospectTitle: data.profile?.title || 'Unknown Title',
          addedAt: new Date(),
        });
        addToast(`Found and added: ${data.email}`, 'success');
        setLinkedinUrl('');
      } else {
        addToast(data.error || 'No email found for this profile', 'info');
      }
    } catch (err) {
      addToast('ContactOut search failed', 'error');
    } finally {
      setLinkedinLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/30 p-4 md:p-6 space-y-5 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Find Prospects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Search a company to find hiring teams, or lookup a specific LinkedIn profile directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Domain Search Card */}
          <div className="bg-background border rounded-lg p-4 space-y-4 shadow-xs flex flex-col">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5 flex-wrap">
                Company Search
                <div className="flex gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">Apollo</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">Hunter</span>
                </div>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Enter a domain to find multiple people.
              </p>
            </div>
            <div className="mt-auto">
              <SearchProspectsForm />
            </div>
          </div>
          
          {/* LinkedIn Lookup Card */}
          <div className="bg-background border rounded-lg p-4 space-y-4 shadow-xs flex flex-col">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                Direct LinkedIn Lookup
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">ContactOut</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Instantly find email and add to list.
              </p>
            </div>
            <form onSubmit={handleLinkedinSubmit} className="flex flex-col sm:flex-row gap-2 mt-auto">
              <Input
                placeholder="https://linkedin.com/in/..."
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                disabled={linkedinLoading}
                className="h-10 text-sm flex-1 bg-card"
                autoComplete="off"
              />
              <Button type="submit" disabled={linkedinLoading || !linkedinUrl.trim()} className="h-10 shrink-0 w-full sm:w-auto">
                {linkedinLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Find Email
              </Button>
            </form>
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
            <Link href="/app/compose">
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Mail className="w-3.5 h-3.5" />
                Compose Emails
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
