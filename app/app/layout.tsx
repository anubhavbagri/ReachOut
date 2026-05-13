'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Settings, Search, Mail, RotateCcw, Menu, X, Send } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';

const NAV_LINKS = [
  { href: '/app', label: 'Search', icon: Search },
  { href: '/app/manual-send', label: 'Manual Send', icon: Send },
  { href: '/app/compose', label: 'Compose', icon: Mail },
  { href: '/app/follow-ups', label: 'Follow-ups', icon: RotateCcw },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const emailList = useStore(state => state.emailList);

  const isActive = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname.startsWith(href);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-52 border-r border-border bg-card/50 flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 font-bold text-base hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">R</div>
            <span>ReachOut</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                isActive(href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
              {href === '/app/compose' && emailList.length > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {emailList.length}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile layout */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 shrink-0 z-40 relative">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">R</div>
            <span>ReachOut</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(v => !v)} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Menu">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-14 left-0 right-0 z-50 border-b border-border bg-card shadow-xl">
            <nav className="p-3 space-y-0.5">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {href === '/app/compose' && emailList.length > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {emailList.length}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-auto">{children}</main>

        {/* Mobile bottom tab bar — show only main items to avoid overflow */}
        <nav className="md:hidden border-t border-border bg-card/95 backdrop-blur shrink-0">
          <div className="flex">
            {NAV_LINKS.slice(0, 5).map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-colors relative ${
                  isActive(href) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {isActive(href) && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                )}
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {href === '/app/compose' && emailList.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {emailList.length > 9 ? '9+' : emailList.length}
                    </span>
                  )}
                </div>
                <span className="leading-none">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
