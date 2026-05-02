'use client';

import { Card } from '@/components/ui/card';
import { Empty } from '@/components/ui/empty';

export default function CampaignsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card/50 p-6 space-y-4">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <p className="text-muted-foreground">
          Track and manage your outreach campaigns
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <Empty
          icon="📧"
          title="No campaigns yet"
          description="Create your first campaign by searching for prospects and sending emails"
        />
      </div>
    </div>
  );
}
