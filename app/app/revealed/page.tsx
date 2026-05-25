'use client';

import { useEffect, useState } from 'react';
import { dbGetRevealedProspects, RevealedProspect } from '@/lib/supabase-db';
import { Mail, Clock, ExternalLink, Send, Download, Copy, Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RevealedPage() {
  const [prospects, setProspects] = useState<RevealedProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const addToEmailList = useStore(state => state.addToEmailList);
  const addToast = useStore(state => state.addToast);

  const handleCopyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
    addToast('Email copied to clipboard', 'success');
  };

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

  const handleExport = () => {
    const toExport = prospects.filter(p => selected.has(p.apollo_id || p.id || ''));
    if (toExport.length === 0) return;

    // Excel compatible UTF-8 BOM
    const BOM = '\uFEFF';
    const headers = ['Company', 'Name', 'Title', 'Email', 'Recipient Type', 'Source', 'Revealed At'];
    const rows = toExport.map(p => [
      p.company || '',
      p.name || p.first_name || '',
      p.title || '',
      p.email || '',
      p.recipient_type || 'HR',
      p.source || '',
      p.revealed_at ? new Date(p.revealed_at).toLocaleDateString() : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          const stringified = String(val).replace(/"/g, '""');
          return stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')
            ? `"${stringified}"`
            : stringified;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `revealed_prospects_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(`Successfully exported ${toExport.length} prospects!`, 'success');
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
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
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
                    <th className="px-4 py-3 font-medium">Type</th>
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
                            <button
                              onClick={(e) => handleCopyEmail(e, p.email)}
                              className="p-1 rounded text-muted-foreground hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-950/50 dark:hover:text-green-400 transition-colors"
                              title="Copy email"
                            >
                              {copiedEmail === p.email ? (
                                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            (p.recipient_type || 'HR') === 'HR'
                              ? 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
                              : 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800'
                          }`}>
                            {p.recipient_type || 'HR'}
                          </span>
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
