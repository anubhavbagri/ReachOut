'use client';

import { useState } from 'react';
import { Prospect } from '@/lib/types';
import { useStore } from '@/lib/store';
import {
  apolloRevealEmail,
  hunterFindEmail,
  contactOutFindEmail,
  normalizeDomain,
} from '@/lib/api-clients';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Building2,
  Mail,
  ExternalLink,
  Loader2,
  Linkedin,
  Plus,
  CheckCircle2,
  EyeOff,
} from 'lucide-react';

interface ProspectsGridProps {
  prospects: Prospect[];
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function ProspectCard({ prospect }: { prospect: Prospect }) {
  const updateProspectEmail = useStore(state => state.updateProspectEmail);
  const addToast = useStore(state => state.addToast);
  const settings = useStore(state => state.settings);
  const addToEmailList = useStore(state => state.addToEmailList);
  const removeFromEmailList = useStore(state => state.removeFromEmailList);
  const isInEmailList = useStore(state => state.isInEmailList);

  const [revealingApollo, setRevealingApollo] = useState(false);
  const [revealingHunter, setRevealingHunter] = useState(false);
  const [revealingContactOut, setRevealingContactOut] = useState(false);

  const hasEmail = !!prospect.email;
  const inList = isInEmailList(prospect.id);

  const domain = prospect.website
    ? normalizeDomain(prospect.website)
    : normalizeDomain(prospect.company);

  const linkedinUrl = prospect.linkedin
    ? (prospect.linkedin.startsWith('http') ? prospect.linkedin : `https://${prospect.linkedin}`)
    : null;

  // ── Reveal handlers ──────────────────────────────────────────────────────

  const handleRevealApollo = async () => {
    if (!settings.apolloApiKey) {
      addToast('Add your Apollo API key in Settings', 'warning'); return;
    }
    setRevealingApollo(true);
    try {
      const email = await apolloRevealEmail(prospect.id, settings.apolloApiKey);
      if (email) {
        updateProspectEmail(prospect.id, email);
        addToast(`Email found: ${email}`, 'success');
      } else {
        addToast('Apollo: No email found for this person', 'info');
      }
    } catch (err) {
      addToast(`Apollo error: ${err instanceof Error ? err.message : 'Failed'}`, 'error');
    } finally {
      setRevealingApollo(false);
    }
  };

  const handleRevealHunter = async () => {
    if (!settings.hunterApiKey) {
      addToast('Add your Hunter API key in Settings', 'warning'); return;
    }
    setRevealingHunter(true);
    try {
      const email = await hunterFindEmail(
        prospect.firstName,
        prospect.lastName,
        domain,
        settings.hunterApiKey
      );
      if (email) {
        updateProspectEmail(prospect.id, email);
        addToast(`Email found: ${email}`, 'success');
      } else {
        addToast('Hunter: No email found for this person', 'info');
      }
    } catch (err) {
      addToast(`Hunter error: ${err instanceof Error ? err.message : 'Failed'}`, 'error');
    } finally {
      setRevealingHunter(false);
    }
  };

  const handleRevealContactOut = async () => {
    if (!settings.contactOutApiKey) {
      addToast('Add your ContactOut API key in Settings', 'warning'); return;
    }
    if (!linkedinUrl) {
      addToast('ContactOut requires a LinkedIn profile URL', 'info'); return;
    }
    setRevealingContactOut(true);
    try {
      const email = await contactOutFindEmail(linkedinUrl, settings.contactOutApiKey);
      if (email) {
        updateProspectEmail(prospect.id, email);
        addToast(`Email found: ${email}`, 'success');
      } else {
        addToast('ContactOut: No email found for this person', 'info');
      }
    } catch (err) {
      addToast(`ContactOut error: ${err instanceof Error ? err.message : 'Failed'}`, 'error');
    } finally {
      setRevealingContactOut(false);
    }
  };

  const handleToggleList = () => {
    if (!hasEmail) {
      addToast('Reveal an email first before adding to send list', 'info');
      return;
    }
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
            className="shrink-0 w-8 h-8 rounded-lg bg-[#0077b5]/10 flex items-center justify-center text-[#0077b5] hover:bg-[#0077b5]/20 transition-colors"
            title={`${prospect.firstName}'s LinkedIn`}
            onClick={e => e.stopPropagation()}
          >
            <LinkedInIcon className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Row 2: Email reveal buttons OR revealed email */}
      <div>
        {hasEmail ? (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
            <Mail className="w-3.5 h-3.5 text-green-600 shrink-0" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400 truncate flex-1">
              {prospect.email}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {/* Apollo button — always shown (required key) */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 px-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30 flex-1 min-w-0"
              onClick={handleRevealApollo}
              disabled={revealingApollo || !settings.apolloApiKey}
              title={!settings.apolloApiKey ? 'Add Apollo API key in Settings' : 'Find email via Apollo'}
            >
              {revealingApollo ? <Loader2 className="w-3 h-3 animate-spin shrink-0" /> : null}
              <span className="truncate">Apollo</span>
            </Button>

            {/* Hunter button — only if key set */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 px-2 border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/30 flex-1 min-w-0"
              onClick={handleRevealHunter}
              disabled={revealingHunter || !settings.hunterApiKey}
              title={!settings.hunterApiKey ? 'Add Hunter API key in Settings' : 'Find email via Hunter'}
            >
              {revealingHunter ? <Loader2 className="w-3 h-3 animate-spin shrink-0" /> : null}
              <span className="truncate">Hunter</span>
            </Button>

            {/* ContactOut button — only if key set */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 px-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/30 flex-1 min-w-0"
              onClick={handleRevealContactOut}
              disabled={revealingContactOut || !settings.contactOutApiKey || !linkedinUrl}
              title={
                !settings.contactOutApiKey
                  ? 'Add ContactOut API key in Settings'
                  : !linkedinUrl
                  ? 'LinkedIn URL required'
                  : 'Find email via ContactOut'
              }
            >
              {revealingContactOut ? <Loader2 className="w-3 h-3 animate-spin shrink-0" /> : null}
              <span className="truncate">ContactOut</span>
            </Button>
          </div>
        )}
      </div>

      {/* Row 3: Add to list CTA */}
      <Button
        size="sm"
        variant={inList ? 'default' : 'outline'}
        className={`w-full h-8 text-xs gap-1.5 ${
          inList
            ? 'bg-primary text-primary-foreground'
            : hasEmail
            ? ''
            : 'opacity-40 cursor-not-allowed'
        }`}
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
    </Card>
  );
}

export function ProspectsGrid({ prospects }: ProspectsGridProps) {
  const emailList = useStore(state => state.emailList);

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
        {prospects.map(prospect => (
          <ProspectCard key={prospect.id} prospect={prospect} />
        ))}
      </div>
    </div>
  );
}
