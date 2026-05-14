'use client';

import { useState } from 'react';
import { Prospect } from '@/lib/types';
import { useStore } from '@/lib/store';
import { normalizeDomain } from '@/lib/api-clients';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Briefcase, Building2, Mail, ExternalLink,
  Loader2, Plus, CheckCircle2, EyeOff, Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function ProspectCard({ prospect }: { prospect: Prospect }) {
  const updateProspectEmail = useStore(s => s.updateProspectEmail);
  const addToast = useStore(s => s.addToast);
  const addToEmailList = useStore(s => s.addToEmailList);
  const removeFromEmailList = useStore(s => s.removeFromEmailList);
  const isInEmailList = useStore(s => s.isInEmailList);

  const [revealingApollo, setRevealingApollo] = useState(false);
  const [revealingHunter, setRevealingHunter] = useState(false);
  const [apolloDetails, setApolloDetails] = useState<Record<string, unknown> | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const hasEmail = !!prospect.email;
  const inList = isInEmailList(prospect.id);

  const domain = prospect.website
    ? normalizeDomain(prospect.website)
    : normalizeDomain(prospect.company);

  const linkedinUrl = prospect.linkedin
    ? (prospect.linkedin.startsWith('http') ? prospect.linkedin : `https://${prospect.linkedin}`)
    : null;

  async function revealViaRoute(
    route: string,
    body: object,
    setter: (v: boolean) => void
  ) {
    setter(true);
    try {
      const res = await fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (route.includes('apollo') && data.details) {
        setApolloDetails(data.details);
      }

      if (data.email) {
        updateProspectEmail(prospect.id, data.email);
        addToast(`Email found: ${data.email}`, 'success');
      } else {
        addToast(data.error || 'No email found', 'info');
      }
    } catch {
      addToast('Request failed', 'error');
    } finally {
      setter(false);
    }
  }

  const handleToggleList = () => {
    if (!hasEmail) { addToast('Reveal email first', 'info'); return; }
    if (inList) {
      removeFromEmailList(prospect.id);
      addToast('Removed from send list', 'info');
    } else {
      addToEmailList({
        prospectId: prospect.id,
        prospectName: `${prospect.firstName} ${prospect.lastName}`,
        prospectEmail: prospect.email!,
        prospectCompany: prospect.company,
        prospectTitle: prospect.title,
        addedAt: new Date(),
      });
      addToast('Added to send list', 'success');
    }
  };

  return (
    <Card className={`flex flex-col p-4 gap-3 transition-all hover:shadow-md ${inList ? 'ring-2 ring-primary' : ''}`}>
      {/* Row 1: Name + LinkedIn icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-base leading-tight truncate">
            {prospect.firstName} {prospect.lastName}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
            <Briefcase className="w-3 h-3 shrink-0" />
            <span className="truncate">{prospect.title || '—'}</span>
          </p>
          <p className="text-sm text-primary font-medium flex items-center gap-1 truncate">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{prospect.company}</span>
          </p>
        </div>

        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="shrink-0 w-8 h-8 rounded-lg bg-[#0077b5]/10 flex items-center justify-center text-[#0077b5] hover:bg-[#0077b5]/20 transition-colors"
            title={`${prospect.firstName}'s LinkedIn`}
          >
            <LinkedInIcon className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Row 2: Email reveal OR revealed email */}
      <div>
        {hasEmail ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
              <Mail className="w-3.5 h-3.5 text-green-600 shrink-0" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400 truncate flex-1">
                {prospect.email}
              </span>
            </div>
            {apolloDetails && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full text-muted-foreground"
                onClick={() => setShowDetailsModal(true)}
              >
                <Info className="w-3.5 h-3.5 mr-1" /> View Apollo Details
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30 flex-1"
                onClick={() => revealViaRoute('/api/reveal/apollo', { prospectId: prospect.id }, setRevealingApollo)}
                disabled={revealingApollo}
              >
                {revealingApollo ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Apollo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2 border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 flex-1"
                onClick={() => revealViaRoute('/api/reveal/hunter', { firstName: prospect.firstName, lastName: prospect.lastName, website: domain }, setRevealingHunter)}
                disabled={revealingHunter}
              >
                {revealingHunter ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Hunter
              </Button>
            </div>
            {apolloDetails && !hasEmail && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full text-muted-foreground"
                onClick={() => setShowDetailsModal(true)}
              >
                <Info className="w-3.5 h-3.5 mr-1" /> View Apollo Details
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Row 3: Add to list */}
      <Button
        size="sm"
        variant={inList ? 'default' : 'outline'}
        className="w-full h-8 text-xs gap-1.5"
        onClick={handleToggleList}
        disabled={!hasEmail}
      >
        {inList ? (
          <><CheckCircle2 className="w-3.5 h-3.5" />In send list</>
        ) : hasEmail ? (
          <><Plus className="w-3.5 h-3.5" />Add to send list</>
        ) : (
          <><EyeOff className="w-3.5 h-3.5" />Reveal email first</>
        )}
      </Button>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Apollo Profile Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-[50vh] text-xs">
              <pre>{JSON.stringify(apolloDetails, null, 2)}</pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function ProspectsGrid({ prospects }: { prospects: Prospect[] }) {
  const emailList = useStore(s => s.emailList);
  return (
    <div className="p-4 md:p-6 space-y-4">
      {emailList.length > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5 text-sm">
          <span className="font-medium">
            <span className="text-primary font-bold">{emailList.length}</span> in send list
          </span>
          <a href="/app/compose" className="text-primary hover:underline text-xs font-medium flex items-center gap-1">
            Compose emails <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {prospects.map(p => <ProspectCard key={p.id} prospect={p} />)}
      </div>
    </div>
  );
}
