'use client';

import { Prospect } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Mail, ExternalLink } from 'lucide-react';

interface ProspectsGridProps {
  prospects: Prospect[];
}

export function ProspectsGrid({ prospects }: ProspectsGridProps) {
  const selectedProspects = useStore(state => state.selectedProspects);
  const toggleSelection = useStore(state => state.toggleProspectSelection);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
      {prospects.map(prospect => (
        <Card
          key={prospect.id}
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer relative group"
          onClick={() => toggleSelection(prospect.id)}
        >
          {/* Checkbox Overlay */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Checkbox
              checked={selectedProspects.has(prospect.id)}
              onChange={() => toggleSelection(prospect.id)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {prospect.firstName} {prospect.lastName}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Briefcase className="w-3 h-3" />
                {prospect.title}
              </p>
            </div>

            {/* Company & Location */}
            <div className="space-y-2 text-sm">
              <div className="font-medium text-primary truncate">
                {prospect.company}
              </div>
              {prospect.location && (
                <div className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {prospect.location}
                </div>
              )}
            </div>

            {/* Industry & Score */}
            <div className="flex items-center gap-2 flex-wrap">
              {prospect.industry && (
                <Badge variant="secondary">{prospect.industry}</Badge>
              )}
              <Badge className="bg-primary/20 text-primary border-0">
                {prospect.score}% match
              </Badge>
            </div>

            {/* Email & Links */}
            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span className="truncate">{prospect.email}</span>
              </div>
              <div className="flex gap-2">
                {prospect.linkedin && (
                  <a
                    href={prospect.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    LinkedIn
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {prospect.website && (
                  <a
                    href={`https://${prospect.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Selection Indicator */}
          {selectedProspects.has(prospect.id) && (
            <div className="absolute inset-0 rounded-lg border-2 border-primary pointer-events-none" />
          )}
        </Card>
      ))}
    </div>
  );
}
