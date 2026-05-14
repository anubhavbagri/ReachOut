'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Search, Mail, RotateCcw, Send, History } from 'lucide-react';
import { useStore } from '@/lib/store';

const NAV_LINKS = [
  { href: '/app',             label: 'Search',      icon: Search  },
  { href: '/app/manual-send', label: 'Manual Send', icon: Send    },
  { href: '/app/compose',     label: 'Compose',     icon: Mail    },
  { href: '/app/follow-ups',  label: 'Follow-ups',  icon: RotateCcw },
  { href: '/app/revealed',    label: 'Revealed',    icon: History },
  { href: '/app/settings',    label: 'Settings',    icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const emailList = useStore(state => state.emailList);

  const isActive = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname.startsWith(href);

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Desktop sidebar ──────────────────────────────────── */}
      <aside className="hidden md:flex w-52 border-r border-border bg-card/50 flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-base hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
              R
            </div>
            <span>ReachOut</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                isActive(href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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

      {/* ── Main area (mobile + desktop) ─────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">

        {/* Mobile header */}
        <header className="md:hidden flex items-center px-4 py-3 border-b border-border bg-card/50 shrink-0">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
              R
            </div>
            <span>ReachOut</span>
          </Link>
          {/* Current page title shown on mobile header */}
          <span className="ml-auto text-sm font-medium text-muted-foreground">
            {NAV_LINKS.find(n => isActive(n.href))?.label ?? ''}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto min-h-0">{children}</main>

        {/* ── Mobile bottom tab bar ──────────────────────────── */}
        <nav
          className="md:hidden border-t border-border bg-card/95 backdrop-blur shrink-0"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-2.5 text-[10px] font-medium transition-colors relative ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                  )}
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                    {href === '/app/compose' && emailList.length > 0 && (
                      <span className="absolute -top-1 -right-1.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                        {emailList.length > 9 ? '9+' : emailList.length}
                      </span>
                    )}
                  </div>
                  <span className="leading-none">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
