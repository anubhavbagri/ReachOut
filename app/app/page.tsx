'use client';

import { useStore } from '@/lib/store';
import { SearchProspectsForm } from '@/components/search-form';
import { ProspectsGrid } from '@/components/prospects-grid';
import { Button } from '@/components/ui/button';
import { Mail, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
  const search = useStore(state => state.search);
  const emailList = useStore(state => state.emailList);
  const clearEmailList = useStore(state => state.clearEmailList);
  const settings = useStore(state => state.settings);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4 md:p-6 space-y-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Find Recruiters</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enter a company website to find their hiring team
          </p>
        </div>

        {/* API key warning */}
        {!settings.apolloApiKey && (
          <div className="flex items-start gap-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              <span className="font-medium">Apollo API key required.</span>{' '}
              <Link href="/app/settings" className="underline hover:no-underline">
                Add it in Settings →
              </Link>
            </div>
          </div>
        )}

        <SearchProspectsForm />
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
