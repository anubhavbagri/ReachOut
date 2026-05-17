/**
 * Supabase Database Helpers
 * All persistent data (sent emails, Gmail token) lives here.
 * Used from both server (API routes) and client components.
 */

import { createClient } from '@/utils/supabase/client';
import { SentEmail } from '@/lib/types';

export interface RevealedProspect {
  id?: string;
  apollo_id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  linkedin_url?: string;
  title?: string;
  organization_id?: string;
  company?: string;
  email: string;
  source: string;
  revealed_at?: Date;
  recipient_type?: 'HR' | 'HM';
}

// ─── Sent Emails ─────────────────────────────────────────────────────────────

export async function dbGetSentEmails(): Promise<SentEmail[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sent_emails')
    .select('*')
    .order('sent_at', { ascending: false });

  if (error) { console.error('[DB] getSentEmails:', error); return []; }
  return (data ?? []).map(rowToSentEmail);
}

export async function dbInsertSentEmail(email: SentEmail): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('sent_emails').insert(sentEmailToRow(email));
  if (error) console.error('[DB] insertSentEmail:', error);
}

export async function dbUpdateSentEmail(
  id: string,
  updates: Partial<SentEmail>
): Promise<void> {
  const supabase = createClient();
  const row: Record<string, unknown> = {};
  if (updates.followUpStatus !== undefined) row.follow_up_status = updates.followUpStatus;
  if (updates.followUpCount !== undefined) row.follow_up_count = updates.followUpCount;
  if (updates.lastFollowUpAt !== undefined) row.last_follow_up_at = updates.lastFollowUpAt;
  if (updates.notes !== undefined) row.notes = updates.notes;

  const { error } = await supabase.from('sent_emails').update(row).eq('id', id);
  if (error) console.error('[DB] updateSentEmail:', error);
}

// ─── Revealed Prospects ──────────────────────────────────────────────────────

export async function dbInsertRevealedProspect(p: RevealedProspect): Promise<void> {
  const supabase = createClient();
  const row = {
    apollo_id: p.apollo_id,
    first_name: p.first_name,
    last_name: p.last_name,
    name: p.name,
    linkedin_url: p.linkedin_url,
    title: p.title,
    organization_id: p.organization_id,
    company: p.company,
    email: p.email,
    source: p.source,
    recipient_type: p.recipient_type || 'HR',
  };
  const { error } = await supabase.from('revealed_prospects').insert(row);
  if (error) console.error('[DB] insertRevealedProspect:', error);
}

export async function dbGetRevealedProspects(): Promise<RevealedProspect[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('revealed_prospects')
    .select('*')
    .order('revealed_at', { ascending: false });

  if (error) { console.error('[DB] getRevealedProspects:', error); return []; }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    apollo_id: row.apollo_id,
    first_name: row.first_name,
    last_name: row.last_name,
    name: row.name,
    linkedin_url: row.linkedin_url,
    title: row.title,
    organization_id: row.organization_id,
    company: row.company,
    email: row.email,
    source: row.source,
    revealed_at: new Date(row.revealed_at),
    recipient_type: row.recipient_type || 'HR',
  }));
}

// ─── App Config (Gmail refresh token, etc.) ───────────────────────────────────

export async function dbGetConfig(key: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', key)
    .single();

  if (error) return null;
  return data?.value ?? null;
}

export async function dbSetConfig(key: string, value: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('app_config')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) console.error('[DB] setConfig:', error);
}

export async function dbDeleteConfig(key: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('app_config').delete().eq('key', key);
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function rowToSentEmail(row: Record<string, unknown>): SentEmail {
  return {
    id: row.id as string,
    prospectId: row.prospect_id as string,
    prospectName: row.prospect_name as string,
    prospectEmail: row.prospect_email as string,
    prospectCompany: row.prospect_company as string,
    prospectTitle: row.prospect_title as string,
    subject: row.subject as string,
    body: row.body as string,
    sentAt: new Date(row.sent_at as string),
    followUpStatus: row.follow_up_status as SentEmail['followUpStatus'],
    followUpCount: row.follow_up_count as number,
    lastFollowUpAt: row.last_follow_up_at ? new Date(row.last_follow_up_at as string) : undefined,
    notes: row.notes as string | undefined,
    gmailThreadId: row.gmail_thread_id as string | undefined,
    recipientType: (row.recipient_type as 'HR' | 'HM') || 'HR',
  };
}

function sentEmailToRow(e: SentEmail): Record<string, unknown> {
  return {
    id: e.id,
    prospect_id: e.prospectId,
    prospect_name: e.prospectName,
    prospect_email: e.prospectEmail,
    prospect_company: e.prospectCompany,
    prospect_title: e.prospectTitle,
    subject: e.subject,
    body: e.body,
    sent_at: e.sentAt.toISOString(),
    follow_up_status: e.followUpStatus,
    follow_up_count: e.followUpCount,
    last_follow_up_at: e.lastFollowUpAt?.toISOString() ?? null,
    notes: e.notes ?? null,
    gmail_thread_id: e.gmailThreadId ?? null,
    recipient_type: e.recipientType || 'HR',
  };
}
