-- ============================================================================
-- ReachOut — Complete Supabase Schema
-- Run this in your Supabase SQL Editor to set up all tables from scratch.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.
-- ============================================================================

-- ─── 1. Revealed Prospects ─────────────────────────────────────────────────────
-- Stores every email address revealed via Apollo / Hunter / ContactOut.

CREATE TABLE IF NOT EXISTS revealed_prospects (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apollo_id     TEXT,
  first_name    TEXT,
  last_name     TEXT,
  name          TEXT,
  linkedin_url  TEXT,
  title         TEXT,
  organization_id TEXT,
  company       TEXT,
  email         TEXT NOT NULL,
  source        TEXT NOT NULL DEFAULT 'apollo',   -- apollo | hunter | contactout | manual
  recipient_type TEXT DEFAULT 'HR' CHECK (recipient_type IN ('HR', 'HM')),
  revealed_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. Sent Emails ────────────────────────────────────────────────────────────
-- Every email sent through the app (initial outreach + follow-ups).
-- Tracks follow-up state for the Follow-ups dashboard.

CREATE TABLE IF NOT EXISTS sent_emails (
  id                TEXT PRIMARY KEY,               -- e.g. "sent-1715000000000-0"
  prospect_id       TEXT NOT NULL,
  prospect_name     TEXT NOT NULL,
  prospect_email    TEXT NOT NULL UNIQUE,
  prospect_company  TEXT DEFAULT '',
  prospect_title    TEXT DEFAULT '',
  subject           TEXT NOT NULL,
  body              TEXT NOT NULL,
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  follow_up_status  TEXT NOT NULL DEFAULT 'pending'
                    CHECK (follow_up_status IN ('pending', 'followed_up', 'replied', 'replied_positive', 'replied_negative', 'not_interested')),
  follow_up_count   INTEGER NOT NULL DEFAULT 0,
  last_follow_up_at TIMESTAMPTZ,
  notes             TEXT,
  gmail_thread_id   TEXT,
  recipient_type    TEXT DEFAULT 'HR' CHECK (recipient_type IN ('HR', 'HM'))
);

-- ─── 3. App Config (key-value store) ──────────────────────────────────────────
-- Stores singleton config values: Gmail refresh token, settings, etc.

CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sent_emails_status
  ON sent_emails (follow_up_status);

CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at
  ON sent_emails (sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_revealed_prospects_email
  ON revealed_prospects (email);

CREATE INDEX IF NOT EXISTS idx_revealed_prospects_revealed_at
  ON revealed_prospects (revealed_at DESC);

-- ─── 5. Row-Level Security (RLS) ──────────────────────────────────────────────
-- Disable RLS for single-user / local-dev usage.
-- If you deploy with Supabase Auth, replace these with proper policies.

ALTER TABLE revealed_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_emails        ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config         ENABLE ROW LEVEL SECURITY;

-- Allow full access for authenticated users (single-user app)
DO $$
BEGIN
  -- revealed_prospects
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'revealed_prospects' AND policyname = 'allow_all_revealed'
  ) THEN
    CREATE POLICY allow_all_revealed ON revealed_prospects FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- sent_emails
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sent_emails' AND policyname = 'allow_all_sent'
  ) THEN
    CREATE POLICY allow_all_sent ON sent_emails FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- app_config
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'app_config' AND policyname = 'allow_all_config'
  ) THEN
    CREATE POLICY allow_all_config ON app_config FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
