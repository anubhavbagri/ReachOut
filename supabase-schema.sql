-- =====================================================
-- ReachOut — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================

-- ── sent_emails ──────────────────────────────────────
create table if not exists public.sent_emails (
  id                text        primary key,
  prospect_id       text        not null,
  prospect_name     text        not null,
  prospect_email    text        not null,
  prospect_company  text        not null default '',
  prospect_title    text        not null default '',
  subject           text        not null,
  body              text        not null,
  sent_at           timestamptz not null default now(),
  follow_up_status  text        not null default 'pending'
                    check (follow_up_status in ('pending','followed_up','replied','not_interested')),
  follow_up_count   integer     not null default 0,
  last_follow_up_at timestamptz,
  notes             text,
  gmail_thread_id   text,
  created_at        timestamptz not null default now()
);

-- ── app_config (Gmail refresh token, etc.) ───────────
create table if not exists public.app_config (
  key        text        primary key,
  value      text        not null,
  updated_at timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────
-- We use our own auth (custom cookie), so we allow all ops via the anon key.
alter table public.sent_emails enable row level security;
alter table public.app_config  enable row level security;

create policy "allow_all_sent_emails"
  on public.sent_emails for all to anon using (true) with check (true);

create policy "allow_all_app_config"
  on public.app_config for all to anon using (true) with check (true);

-- ── Indexes ───────────────────────────────────────────
create index if not exists sent_emails_sent_at_idx
  on public.sent_emails (sent_at desc);

create index if not exists sent_emails_status_idx
  on public.sent_emails (follow_up_status);

-- ── revealed_prospects ───────────────────────────────
create table if not exists public.revealed_prospects (
  id                uuid        primary key default gen_random_uuid(),
  apollo_id         text,
  first_name        text,
  last_name         text,
  name              text,
  linkedin_url      text,
  title             text,
  organization_id   text,
  company           text,
  email             text        not null,
  source            text        not null default 'apollo',
  revealed_at       timestamptz not null default now()
);

alter table public.revealed_prospects enable row level security;

create policy "allow_all_revealed_prospects"
  on public.revealed_prospects for all to anon using (true) with check (true);

create index if not exists revealed_prospects_email_idx
  on public.revealed_prospects (email);

create index if not exists revealed_prospects_revealed_at_idx
  on public.revealed_prospects (revealed_at desc);
