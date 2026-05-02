import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ReachOut - Search Prospects',
  description: 'Find and manage prospects for your cold outreach campaigns',
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              R
            </div>
            <span>ReachOut</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/app"
            className="block px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium transition-colors"
          >
            Search Prospects
          </Link>
          <Link
            href="/app/compose"
            className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            Compose Emails
          </Link>
          <Link
            href="/app/campaigns"
            className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            Campaigns
          </Link>
        </nav>

        <div className="border-t border-border p-4 space-y-2">
          <Link href="/app/settings">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
