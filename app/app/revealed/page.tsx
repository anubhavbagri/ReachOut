'use client';

import { useEffect, useState } from 'react';
import { dbGetRevealedProspects, RevealedProspect } from '@/lib/supabase-db';
import { Mail, Clock, ExternalLink, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RevealedPage() {
  const [prospects, setProspects] = useState<RevealedProspect[]>([]);
  const [loading, setLoading] = useState(true);

  const emailList = useStore(state => state.emailList);
  const addToEmailList = useStore(state => state.addToEmailList);
  const removeFromEmailList = useStore(state => state.removeFromEmailList);
  const isInEmailList = useStore(state => state.isInEmailList);
  const clearEmailList = useStore(state => state.clearEmailList);
  const addToast = useStore(state => state.addToast);

  useEffect(() => {
    async function load() {
      const data = await dbGetRevealedProspects();
      setProspects(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <div className="border-b border-border bg-card/50 p-6 shrink-0">
        <h1 className="text-3xl font-bold">Revealed Prospects</h1>
        <p className="text-muted-foreground mt-1">History of all emails revealed.</p>
      </div>

      {/* Email list action bar */}
      {emailList.length > 0 && (
        <div className="shrink-0 border-b border-border bg-primary/5 px-6 py-3 flex flex-wrap items-center justify-between gap-2">
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
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Source</th>
                    <th className="px-4 py-3 font-medium">Revealed</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {prospects.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary">
                        {p.company || 'Unknown Company'}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {p.linkedin_url ? (
                          <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                            {p.name || p.first_name || 'Unknown'} <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </a>
                        ) : (
                          p.name || p.first_name || 'Unknown'
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.title || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-green-700 dark:text-green-400">
                          <Mail className="w-3.5 h-3.5" />
                          {p.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell capitalize">
                        {p.source}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5" />
                        {p.revealed_at?.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(() => {
                          const id = p.apollo_id || p.id || '';
                          const inList = isInEmailList(id);
                          return (
                            <Button
                              size="sm"
                              variant={inList ? 'default' : 'outline'}
                              className="h-7 text-xs"
                              onClick={() => {
                                if (inList) {
                                  removeFromEmailList(id);
                                  addToast('Removed from send list', 'info');
                                } else {
                                  addToEmailList({
                                    prospectId: id,
                                    prospectName: p.name || p.first_name || 'Unknown',
                                    prospectEmail: p.email,
                                    prospectCompany: p.company || p.organization_id || 'Unknown Company',
                                    prospectTitle: p.title || '',
                                    addedAt: new Date(),
                                  });
                                  addToast('Added to send list', 'success');
                                }
                              }}
                            >
                              {inList ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Added</> : <><Plus className="w-3.5 h-3.5 mr-1" />Add to list</>}
                            </Button>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
