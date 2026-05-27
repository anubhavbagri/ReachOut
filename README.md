# ReachOut — Personal Cold Outreach Agent

A private, personal cold outreach platform. Find hiring managers & recruiters at any company, reveal their emails via Apollo/Hunter/ContactOut, write AI-personalized emails with Gemini, send from your personal Gmail, and track all follow-ups in Supabase.

> **Private by design** - protected by a login gate. No external SaaS. All data in your own Supabase project.
>
> 📬 **Gmail setup?** See [GMAIL_SETUP.md](./GMAIL_SETUP.md) for the complete step-by-step guide.

## Features

### 🔍 Prospect Search (Apollo)

- Enter any company domain (e.g. `stripe.com`)
- Apollo People API returns recruiters, TA specialists, and hiring managers
- Customizable job title filters shown in the UI (add/remove from search page)

### 📧 Triple Email Reveal

| Source | Trigger | Notes |
|---|---|---|
| **Apollo** | `Apollo` button | Primary — uses person ID from search |
| **Hunter.io** | `Hunter` button | Fallback — domain-based lookup |
| **ContactOut** | `ContactOut` button | LinkedIn URL required |

All reveal calls go through server-side Next.js API routes — API keys never touch the client.

### 🤖 Gemini AI Email Writing

Three generation modes:

- **Template** — fast variable substitution (`{{firstName}}`, `{{company}}`, etc.)
- **AI by Domain** — Gemini researches the company and writes a tailored email
- **AI by Job Description** — paste a JD and Gemini writes around specific role details

Three tones: Professional / Friendly / Casual

### 📋 Manual CSV Import (`/app/manual-send`)

Bring your own contact list:

- Paste CSV, upload `.csv` file, or add manually row by row
- Supported columns: `firstName, lastName, email, company, title, website`
- Also supports: `Full Name, email, company, title`
- Same AI generation modes as Apollo flow

### ✉️ Gmail Bulk Send

- OAuth 2.0 — connects to your personal Gmail account once
- Refresh token stored in Supabase `app_config` — works across all devices
- Configurable delay between emails (default 1500ms)
- All sends tracked in Supabase for follow-up

### 📊 Follow-up Tracking (Supabase-backed)

- Every sent email persisted in `sent_emails` table
- Status: `pending` → `followed_up` → `replied` / `not_interested`
- Pre-built follow-up templates (3 variants) with editable content
- **Bulk Sending**: Select multiple pending follow-ups and send them at once
- **Thread Replies**: Follow-ups are automatically sent as replies to the original email thread
- Badge shows how many contacts are overdue for follow-up (3+ days)
- Loads from Supabase on every visit — cross-device sync

### 👥 HR vs Hiring Manager Tracking

- Classify contacts as `HR` or `HM` (Hiring Manager) directly on the search cards
- Persisted across `revealed_prospects` and `sent_emails` tables
- View categorization at a glance in the Follow-ups and Revealed dashboards

### 🔒 Private Login

- Username/password login gate (credentials stored in Vercel env vars)
- 90-day session cookie — stay logged in across devices
- All `/app` and `/api` routes are protected by Next.js middleware

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS + Clay design system (oklch palette) |
| AI | Google Gemini (`@ai-sdk/google`) |
| Database | Supabase (PostgreSQL) |
| Auth | Custom cookie middleware (no Supabase Auth needed) |
| Email Send | Gmail API via OAuth 2.0 |
| Prospect Data | Apollo.io People API |
| Email Reveal | Apollo / Hunter.io / ContactOut |
| State | Zustand (session UI cache only) |
| Deployment | Vercel |

## Setup

### 1. Clone & install

```bash
git clone <repo-url>
cd v0-cold-outreach-agent
npm install
```

### 2. Supabase — create tables

Go to **Supabase Dashboard → SQL Editor** and run the consolidated setup script located at [`supabase/schema.sql`](./supabase/schema.sql):

```sql
-- Creates: revealed_prospects, sent_emails, app_config
-- Sets permissive RLS policies (access controlled by our cookie middleware)
-- Includes indexes and HR/HM constraints
```

### 3. Environment variables

Copy `.env.example` → `.env.local` and fill in:

```env
# Supabase (from Supabase Dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# App login (your private credentials — choose anything)
APP_USERNAME=anubhav
APP_PASSWORD=your_secure_password
APP_SECRET=some_random_string_for_signing_sessions

# Gmail OAuth (Google Cloud Console → OAuth 2.0 Credentials)
NEXT_PUBLIC_BASE_URL=https://your-vercel-url.vercel.app
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...

# API keys (never exposed to client)
APOLLO_API_KEY=...
HUNTER_API_KEY=...
CONTACTOUT_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

### 4. Gmail OAuth setup (one-time)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Gmail API**
3. Create **OAuth 2.0 Credentials** (Web application type)
4. Add Authorized Redirect URI: `https://your-vercel-url.vercel.app/api/auth/gmail/callback`
5. Copy Client ID + Secret into env vars
6. After deploying, go to **Settings → Connect Gmail**
7. The refresh token is stored in Supabase `app_config` — no re-auth needed on new devices

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── page.tsx                 # Landing page
├── login/page.tsx           # Login gate
├── api/
│   ├── auth/login/          # Session cookie endpoint
│   ├── auth/logout/         # Clear session
│   ├── auth/gmail/          # OAuth flow start
│   ├── generate-email/      # Gemini generation (server)
│   ├── mcp/gmail/           # Gmail send (reads token from Supabase)
│   ├── reveal/apollo/       # Apollo email reveal (server)
│   ├── reveal/hunter/       # Hunter email reveal (server)
│   ├── reveal/contactout/   # ContactOut reveal (server)
│   └── search/              # Apollo People search (server)
└── app/
    ├── page.tsx             # Search prospects
    ├── compose/             # Review & generate emails
    ├── manual-send/         # CSV import + batch email
    ├── follow-ups/          # Supabase-backed tracking
    └── settings/            # Gmail connect + preferences

components/
├── search-form.tsx          # Domain search + title filters
├── prospects-grid.tsx       # Prospect cards + reveal buttons
├── email-bulk-sender.tsx    # Gmail bulk send UI
├── manual-send-form.tsx     # CSV import + AI draft
└── gmail-callback-handler.tsx # OAuth callback → Supabase

lib/
├── store.ts                 # Zustand (UI cache, no API keys)
├── supabase-db.ts           # Supabase helpers (sent_emails, app_config)
├── email-generator.ts       # Gemini generation logic
├── email-templates.ts       # Preset cold + follow-up templates
└── api-clients.ts           # Apollo/Hunter/ContactOut (called from API routes)

supabase/
├── schema.sql               # Complete DB schema (run in Supabase SQL Editor)
└── migrations/              # Incremental SQL changes

utils/supabase/
├── client.ts                # Browser Supabase client
└── server.ts                # Server Supabase client (API routes)

middleware.ts                # Auth gate — protects /app and /api/*
```

## Deploying to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy
5. Connect Gmail in Settings → done

## Supabase Tables

### `revealed_prospects`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Auto-generated |
| `email` | text | Revealed email address |
| `name` / `company` / `title` | text | Prospect info |
| `source` | text | `apollo` / `hunter` / `contactout` |
| `recipient_type` | text | `HR` or `HM` |
| `revealed_at` | timestamptz | |

### `sent_emails`

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | Generated on send |
| `prospect_name` / `email` / `company` | text | Contact info |
| `subject` / `body` | text | Email content |
| `recipient_type` | text | `HR` or `HM` |
| `sent_at` | timestamptz | |
| `follow_up_status` | text | `pending` / `followed_up` / `replied` / `replied_positive` / `replied_negative` / `not_interested` |
| `follow_up_count` | int | Increments on each follow-up |
| `last_follow_up_at` | timestamptz | |
| `gmail_thread_id` | text | For direct Gmail link and thread replies |

### `app_config`

| Column | Type | Notes |
|---|---|---|
| `key` | text PK | e.g. `gmail_refresh_token`, `gmail_user_email` |
| `value` | text | |
| `updated_at` | timestamptz | |
