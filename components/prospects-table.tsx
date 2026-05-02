'use client';

import { Prospect } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface ProspectsTableProps {
  prospects: Prospect[];
}

export function ProspectsTable({ prospects }: ProspectsTableProps) {
  const selectedProspects = useStore(state => state.selectedProspects);
  const toggleSelection = useStore(state => state.toggleProspectSelection);
  const selectAllProspects = useStore(state => state.selectAllProspects);

  const allSelected = prospects.length > 0 && prospects.every(p => selectedProspects.has(p.id));

  return (
    <div className="w-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-background border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">
              <Checkbox
                checked={allSelected}
                onChange={() => {
                  if (allSelected) {
                    useStore.setState({ selectedProspects: new Set() });
                  } else {
                    selectAllProspects();
                  }
                }}
              />
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Match</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {prospects.map(prospect => (
            <tr
              key={prospect.id}
              className="hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => toggleSelection(prospect.id)}
            >
              <td className="px-4 py-3">
                <Checkbox
                  checked={selectedProspects.has(prospect.id)}
                  onChange={() => toggleSelection(prospect.id)}
                  onClick={e => e.stopPropagation()}
                />
              </td>
              <td className="px-4 py-3 font-medium">
                {prospect.firstName} {prospect.lastName}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{prospect.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{prospect.company}</td>
              <td className="px-4 py-3 text-muted-foreground truncate max-w-xs">
                {prospect.email}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {prospect.location || '-'}
              </td>
              <td className="px-4 py-3">
                <Badge className="bg-primary/20 text-primary border-0">
                  {prospect.score}%
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
