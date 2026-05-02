'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { SearchProspectsForm } from '@/components/search-form';
import { ProspectsTable } from '@/components/prospects-table';
import { ProspectsGrid } from '@/components/prospects-grid';
import { ActionBar } from '@/components/action-bar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List } from 'lucide-react';

export default function SearchPage() {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const search = useStore(state => state.search);
  const selectedProspects = useStore(state => state.selectedProspects);

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="border-b border-border bg-card/50 p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Prospects</h1>
          <p className="text-muted-foreground">
            Search our database of 10M+ professionals and companies
          </p>
        </div>

        {/* Search Form */}
        <SearchProspectsForm />
      </div>

      {/* Results Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {search.results.length > 0 ? (
          <>
            {/* Toolbar */}
            <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {search.totalCount} prospects found
                </span>
                {selectedProspects.size > 0 && (
                  <span className="text-sm font-medium text-primary">
                    {selectedProspects.size} selected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'grid')}>
                  <TabsList className="grid w-auto grid-cols-2">
                    <TabsTrigger value="grid" size="sm">
                      <LayoutGrid className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="table" size="sm">
                      <List className="w-4 h-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Results View */}
            <div className="flex-1 overflow-auto">
              {viewMode === 'table' ? (
                <ProspectsTable prospects={search.results} />
              ) : (
                <ProspectsGrid prospects={search.results} />
              )}
            </div>

            {/* Action Bar (Sticky Bottom) */}
            {selectedProspects.size > 0 && <ActionBar selectedCount={selectedProspects.size} />}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl opacity-20">🔍</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No prospects yet</h3>
                <p className="text-muted-foreground">
                  Use the search above to find prospects and get started
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
