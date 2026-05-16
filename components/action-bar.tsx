'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { X, Mail, Download } from 'lucide-react';

interface ActionBarProps {
  selectedCount: number;
}

export function ActionBar({ selectedCount }: ActionBarProps) {
  const clearSelection = useStore(state => state.clearSelection);
  const getSelectedProspectsData = useStore(state => state.getSelectedProspectsData);

  const handleDownload = () => {
    const prospects = getSelectedProspectsData();
    const csv = [
      ['First Name', 'Last Name', 'Email', 'Company', 'Title', 'Location', 'Industry'],
      ...prospects.map(p => [
        p.firstName,
        p.lastName,
        p.email || '',
        p.company,
        p.title,
        p.location || '',
        p.industry || '',
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospects-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="sticky bottom-0 border-t border-border bg-card px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedCount} prospect{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSelection}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>

        <Link href="/app/send">
          <Button size="sm" className="gap-2">
            <Mail className="w-4 h-4" />
            Send Emails
          </Button>
        </Link>
      </div>
    </div>
  );
}
