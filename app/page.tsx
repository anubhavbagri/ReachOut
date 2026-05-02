import Link from 'next/link';
import { ArrowRight, Mail, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              R
            </div>
            <span className="font-bold text-lg">ReachOut</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="#use-cases" className="text-sm hover:text-primary transition-colors">
              Use Cases
            </Link>
          </nav>
          <Link href="/app">
            <Button className="gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 md:py-32">
        <div className="max-w-3xl text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-balance">
              Cold outreach that&apos;s actually personal
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-balance">
              Find the right prospects, write personalized emails, and send at scale—all powered by AI
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/app">
              <Button size="lg" className="gap-2">
                Try for Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#demo" className="text-primary hover:text-primary/80 font-medium flex items-center gap-2">
              Watch Demo
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            No credit card required. Start reaching out in minutes.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-t border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">10M+</div>
              <p className="text-sm text-muted-foreground">Prospects Searchable</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">90%</div>
              <p className="text-sm text-muted-foreground">Less Time Writing</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-secondary mb-2">3x</div>
              <p className="text-sm text-muted-foreground">Higher Response Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
              <p className="text-sm text-muted-foreground">Personalized Emails</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">One workflow, endless possibilities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From prospect discovery to personalized emails to tracked delivery—all in one place
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Smart Prospect Search</h3>
              <p className="text-muted-foreground">
                Find exactly who you need to reach. Search by title, company, location, or keywords.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold">AI-Powered Writing</h3>
              <p className="text-muted-foreground">
                Generate personalized subject lines and email bodies in seconds. Adjust tone with one click.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold">Send at Scale</h3>
              <p className="text-muted-foreground">
                Send to hundreds of prospects with automatic rate limiting and Gmail integration.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Three simple steps</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From idea to first email in under 5 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: '1',
                title: 'Search & Filter',
                description: 'Find prospects using powerful filters: job title, company size, industry, location, and more.',
              },
              {
                number: '2',
                title: 'Generate Emails',
                description: 'Let AI write personalized, conversion-focused emails for each prospect in your selection.',
              },
              {
                number: '3',
                title: 'Send & Track',
                description: 'Send directly via Gmail with automatic rate limiting, delivery tracking, and reply detection.',
              },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-6 -right-4 text-muted-foreground">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Built for any sales motion</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From startups to enterprises, ReachOut fits your workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Sales Development Reps',
                description: 'Research, personalize, and send hundreds of cold emails weekly with our pipeline automation.',
              },
              {
                title: 'Business Development',
                description: 'Find partnership opportunities and open doors with warm, personalized first emails.',
              },
              {
                title: 'Founders & CEOs',
                description: 'Launch customer discovery campaigns, find advisors, or build strategic partnerships at scale.',
              },
              {
                title: 'Agencies & Consultants',
                description: 'Qualify and reach potential clients with contextual, relevant outreach campaigns.',
              },
            ].map((useCase, idx) => (
              <Card key={idx} className="p-6 space-y-3">
                <h3 className="text-lg font-bold">{useCase.title}</h3>
                <p className="text-muted-foreground">{useCase.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="bg-primary text-primary-foreground rounded-2xl p-12 md:p-16 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to transform your outreach?</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Join hundreds of teams using ReachOut to book more meetings and close more deals
            </p>
            <Link href="/app">
              <Button size="lg" className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-sm opacity-75">No credit card required. Start in minutes.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Docs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                R
              </div>
              <span>ReachOut © {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
