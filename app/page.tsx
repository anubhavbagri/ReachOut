import Link from 'next/link';
import { ArrowRight, Mail, Target, Zap, Database, Send, FileText, Wand2, Github } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm clay-shadow"
              style={{ background: 'oklch(0.58 0.2 25)', color: 'oklch(0.98 0.01 70)' }}
            >
              R
            </div>
            <span className="font-bold text-lg" style={{ color: 'oklch(0.22 0.04 45)' }}>ReachOut</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['#features', '#how-it-works', '#use-cases'].map((href, i) => (
              <a
                key={href}
                href={href}
                className="text-sm transition-colors hover:text-primary"
                style={{ color: 'oklch(0.50 0.04 55)' }}
              >
                {['Features', 'How it Works', 'Use Cases'][i]}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/anubhavbagri/ReachOut"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-border transition-colors hover:bg-muted"
              aria-label="GitHub repository"
              style={{ color: 'oklch(0.45 0.04 55)' }}
            >
              <Github className="w-4 h-4" />
            </a>

            <Link href="/app">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold clay-shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'oklch(0.58 0.2 25)', color: 'oklch(0.98 0.01 70)' }}
              >
                Open App <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative flex-1 flex items-center justify-center px-4 py-24 md:py-36 overflow-hidden">
        {/* Warm blobs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-25"
            style={{ background: 'oklch(0.74 0.12 50)' }} />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[140px] opacity-20"
            style={{ background: 'oklch(0.68 0.08 160)' }} />
        </div>

        <div className="relative max-w-3xl text-center space-y-7">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
            style={{ background: 'oklch(0.96 0.03 40)', color: 'oklch(0.50 0.16 28)', border: '1px solid oklch(0.88 0.08 35)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Personal. Private. Powerful.
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight" style={{ color: 'oklch(0.22 0.04 45)' }}>
            Cold outreach that&apos;s<br />
            <span style={{ color: 'oklch(0.58 0.2 25)' }}>actually personal</span>
          </h1>

          <p className="text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto" style={{ color: 'oklch(0.50 0.04 55)' }}>
            Find the right person. Send the right email.
            <br />Land the job, deal, or meeting.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/app">
              <button
                className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-semibold clay-shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'oklch(0.58 0.2 25)', color: 'oklch(0.98 0.01 70)' }}
              >
                Open ReachOut <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-b border-border py-14">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10M+', label: 'Searchable People', color: 'oklch(0.58 0.2 25)' },
              { value: '3 APIs', label: 'Email Reveal Sources', color: 'oklch(0.74 0.12 50)' },
              { value: 'Gemini', label: 'AI Email Writing', color: 'oklch(0.68 0.08 160)' },
              { value: '100%', label: 'From Your Gmail', color: 'oklch(0.58 0.2 25)' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold mb-1.5" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <p className="text-sm" style={{ color: 'oklch(0.50 0.04 55)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'oklch(0.22 0.04 45)' }}>
              One workflow, every channel
            </h2>
            <p className="max-w-2xl mx-auto" style={{ color: 'oklch(0.50 0.04 55)' }}>
              From prospect discovery to tracked follow-ups — no external SaaS required
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Target,
                title: 'Apollo Prospect Search',
                desc: 'Enter any company domain to instantly surface recruiters, TA specialists, and hiring managers. Customizable job title filters.',
                iconBg: 'oklch(0.96 0.03 25)',
                iconColor: 'oklch(0.58 0.2 25)',
              },
              {
                icon: Zap,
                title: 'Triple Email Reveal',
                desc: 'One-click reveal via Apollo (primary), Hunter.io (fallback), or ContactOut (LinkedIn-based). All routed through secure server-side API routes.',
                iconBg: 'oklch(0.97 0.04 50)',
                iconColor: 'oklch(0.65 0.14 50)',
              },
              {
                icon: Wand2,
                title: 'Gemini AI Personalization',
                desc: 'Generate emails tailored by company domain (researches what they do) or job description paste. Three tones: professional, friendly, casual.',
                iconBg: 'oklch(0.96 0.03 160)',
                iconColor: 'oklch(0.55 0.1 160)',
              },
              {
                icon: FileText,
                title: 'Manual CSV Import',
                desc: 'Paste CSV, upload a file, or add contacts manually for bulk sending without Apollo — perfect for leads you already have.',
                iconBg: 'oklch(0.97 0.04 50)',
                iconColor: 'oklch(0.65 0.14 50)',
              },
              {
                icon: Send,
                title: 'Bulk Gmail Send',
                desc: 'Send from your personal Gmail with rate-limiting delays. OAuth token stored in Supabase — works across all your devices.',
                iconBg: 'oklch(0.96 0.03 25)',
                iconColor: 'oklch(0.58 0.2 25)',
              },
              {
                icon: Database,
                title: 'Supabase Follow-up Tracker',
                desc: 'Every sent email is persisted in Supabase. Track reply status, log follow-ups from preset templates, and see who needs a nudge.',
                iconBg: 'oklch(0.96 0.03 160)',
                iconColor: 'oklch(0.55 0.1 160)',
              },
            ].map(({ icon: Icon, title, desc, iconBg, iconColor }) => (
              <div
                key={title}
                className="p-6 rounded-2xl space-y-3 border border-border transition-all hover:shadow-md"
                style={{ background: 'oklch(0.985 0.01 68)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                  <Icon className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: 'oklch(0.22 0.04 45)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.50 0.04 55)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'oklch(0.22 0.04 45)' }}>
              Two outreach paths
            </h2>
            <p style={{ color: 'oklch(0.50 0.04 55)' }}>
              Find prospects via Apollo, or bring your own contact list
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Path A */}
            <div className="rounded-2xl p-8 space-y-5 border border-border" style={{ background: 'oklch(0.97 0.015 65)' }}>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'oklch(0.96 0.03 25)', color: 'oklch(0.50 0.18 22)' }}
              >
                Path A
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'oklch(0.22 0.04 45)' }}>
                Apollo Search → Compose → Send
              </h3>
              <ol className="space-y-4">
                {[
                  ['Enter company website', 'e.g. stripe.com — Apollo returns all recruiters & HR.'],
                  ['Reveal email', 'Click Apollo / Hunter / ContactOut button per card.'],
                  ['Add to send list → Compose', 'AI writes personalized emails for everyone in the list.'],
                  ['Send from Gmail', 'Bulk send with delay. All tracked in Follow-ups.'],
                ].map(([step, detail], i) => (
                  <li key={step} className="flex gap-3">
                    <div
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'oklch(0.58 0.2 25)', color: 'oklch(0.98 0.01 70)' }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'oklch(0.22 0.04 45)' }}>{step}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'oklch(0.50 0.04 55)' }}>{detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Path B */}
            <div className="rounded-2xl p-8 space-y-5 border border-border" style={{ background: 'oklch(0.97 0.015 65)' }}>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'oklch(0.96 0.03 160)', color: 'oklch(0.38 0.1 155)' }}
              >
                Path B
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'oklch(0.22 0.04 45)' }}>
                Manual Import → AI Draft → Send
              </h3>
              <ol className="space-y-4">
                {[
                  ['Paste CSV or upload file', 'firstName, lastName, email, company, title, website columns.'],
                  ['Choose generation mode', 'Template substitution, AI by domain, or AI by job description.'],
                  ['Review & edit emails', 'Check generated content before sending — edit anything inline.'],
                  ['Bulk send + follow-up', 'Same send flow — all tracked in Supabase.'],
                ].map(([step, detail], i) => (
                  <li key={step} className="flex gap-3">
                    <div
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'oklch(0.68 0.08 160)', color: 'oklch(0.98 0.01 70)' }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'oklch(0.22 0.04 45)' }}>{step}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'oklch(0.50 0.04 55)' }}>{detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use Cases ──────────────────────────────────────────────────────── */}
      <section id="use-cases" className="py-24 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'oklch(0.22 0.04 45)' }}>
              What people use it for
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: '🎯 Job Seekers',
                desc: 'Find recruiters at dream companies, send personalized cold emails referencing their job posts, track who replied.',
              },
              {
                title: '💼 Founders & CEOs',
                desc: 'Open doors with potential customers or partners via warm, AI-personalized outreach at scale.',
              },
              {
                title: '📋 Recruiting (Agencies)',
                desc: 'Contact hiring managers at client companies directly without LinkedIn limits.',
              },
              {
                title: '🚀 Sales Reps',
                desc: 'Build prospect lists from company domains, qualify via email reveal, and send customized pitches.',
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-border space-y-2"
                style={{ background: 'oklch(0.985 0.01 68)' }}
              >
                <h3 className="text-lg font-bold" style={{ color: 'oklch(0.22 0.04 45)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.50 0.04 55)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10" style={{ background: 'oklch(0.95 0.015 68)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: 'oklch(0.55 0.04 55)' }}>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'oklch(0.58 0.2 25)', color: 'oklch(0.98 0.01 70)' }}
            >
              R
            </div>
            <span>ReachOut - Personal Outreach Agent © {new Date().getFullYear()}</span>
          </div>
          <p>
            Vibecoded by{' '}
            <a
              href="https://anubhavbagri.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2 hover:opacity-70 transition-opacity"
              style={{ color: 'oklch(0.58 0.2 25)' }}
            >
              Anubhav Bagri
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
