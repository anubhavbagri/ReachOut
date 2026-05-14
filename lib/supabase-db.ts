/**
 * Supabase Database Helpers
 * All persistent data (sent emails, Gmail token) lives here.
 * Used from both server (API routes) and client components.
 */

import { createClient } from '@/utils/supabase/client';
import { SentEmail } from '@/lib/types';

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
  };
}
