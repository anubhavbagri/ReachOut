'use client';

import { useEffect, useState } from 'react';
import { dbGetRevealedProspects, RevealedProspect } from '@/lib/supabase-db';
import { Mail, Clock, ExternalLink, Send } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RevealedPage() {
  const [prospects, setProspects] = useState<RevealedProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const addToEmailList = useStore(state => state.addToEmailList);
  const addToast = useStore(state => state.addToast);

  useEffect(() => {
    async function load() {
      const data = await dbGetRevealedProspects();
      setProspects(data);
      setLoading(false);
    }
    load();
  }, []);

  const allIds = prospects.map(p => p.apollo_id || p.id || '');
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelected = () => {
    const toAdd = prospects.filter(p => selected.has(p.apollo_id || p.id || ''));
    toAdd.forEach(p => {
      addToEmailList({
        prospectId: p.apollo_id || p.id || '',
        prospectName: p.name || p.first_name || 'Unknown',
        prospectEmail: p.email,
        prospectCompany: p.company || p.organization_id || 'Unknown Company',
        prospectTitle: p.title || '',
        addedAt: new Date(),
      });
    });
    addToast(`${toAdd.length} contact${toAdd.length !== 1 ? 's' : ''} added to send list`, 'success');
    setSelected(new Set());
  };

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4 md:p-6 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Revealed Prospects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">History of all emails revealed.</p>
        </div>

        {someSelected && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={handleAddSelected}>
              <Send className="w-3.5 h-3.5" />
              Add to Send List
            </Button>
            <Link href="/app/send">
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                Go to Send
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : prospects.length === 0 ? (
          <div className="text-center p-8 border rounded-lg bg-card">
            <h3 className="font-semibold text-lg">No prospects revealed yet.</h3>
            <p className="text-muted-foreground text-sm mt-1">Go to the Search page to find and reveal emails.</p>
          </div>
        ) : (
          <div className="bg-card border rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="w-4 h-4 accent-primary cursor-pointer"
                        title="Select all"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Title</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Source</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Revealed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {prospects.map((p) => {
                    const id = p.apollo_id || p.id || '';
                    const isSelected = selected.has(id);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => toggleRow(id)}
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(id)}
                            onClick={e => e.stopPropagation()}
                            className="w-4 h-4 accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-primary">
                          {p.company || 'Unknown Company'}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {p.linkedin_url ? (
                            <a
                              href={p.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1"
                              onClick={e => e.stopPropagation()}
                            >
                              {p.name || p.first_name || 'Unknown'} <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </a>
                          ) : (
                            p.name || p.first_name || 'Unknown'
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.title || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-medium text-green-700 dark:text-green-400">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[180px]">{p.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell capitalize">{p.source}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5" />
                            {p.revealed_at?.toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
