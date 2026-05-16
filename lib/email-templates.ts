/**
 * Email Templates — preset cold email & follow-up templates
 * Variables use {{camelCase}} syntax substituted at send time.
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string;
}

export interface FollowUpTemplate {
  id: string;
  name: string;
  daysAfter: number; // recommended days after initial email
  subject: string;
  body: string;
}

// ─── Outreach Templates (canonical HR & HM) ──────────────────────────────────────────────
// Single source of truth — used by both manual-send and compose pages.

export const HR_OUTREACH_TEMPLATE: EmailTemplate = {
  id: 'hr-outreach',
  name: 'HR Outreach',
  description: 'Friendly intro to a recruiter at a company you want to work at',
  subject: 'Exploring opportunities at {{company}}',
  body: `Hi {{firstName}},

I came across {{company}} while researching companies doing interesting work in this space, and I'd love to learn more about potential opportunities on your team.

I'm a Software Engineer with experience in full-stack development and product-driven engineering. I've built scalable systems and shipped user-facing features at a fast pace.

Would you be open to a quick 15-minute chat to see if there might be a fit? I'm flexible on timing and happy to work around your schedule.

Thanks for considering,
{{senderName}}`,
};

export const HM_OUTREACH_TEMPLATE: EmailTemplate = {
  id: 'hm-outreach',
  name: 'Hiring Manager Outreach',
  description: 'Direct outreach to a hiring manager about a role',
  subject: 'Interested in joining {{company}} - Software Engineer',
  body: `Hi {{firstName}},

I noticed {{company}} is growing its engineering team and I'd love to throw my hat in the ring.

I'm a Software Engineer with a strong background in building scalable products. I enjoy working in fast-paced environments and shipping things that users love.

A few highlights:
- Built and shipped full-stack features from 0 to 1
- Strong in TypeScript, React, Next.js, and backend APIs
- Passionate about clean code and great user experiences

I believe I could contribute meaningfully to {{company}}'s mission. Would you have 15 minutes for a quick call?

Best,
{{senderName}}`,
};

// ─── Cold Email Templates (compose page) ───────────────────────────────────────────
// Includes the canonical HR & HM templates so compose and manual-send stay in sync.

export const COLD_EMAIL_TEMPLATES: EmailTemplate[] = [
  HR_OUTREACH_TEMPLATE,
  {
    id: 'referral-ask',
    name: 'Referral / Network Ask',
    description: 'Asking for a referral or warm intro to the team',
    subject: 'Quick question about {{company}}',
    body: `Hi {{firstName}},

Hope you're having a great week! I've been following {{company}}'s work and I'm really impressed by what you're building.

I'm currently exploring my next move and {{company}} is high on my list. Would you be open to a quick chat about what it's like to work there, and whether there might be a fit for someone with my background?

I know your time is valuable — even 10 minutes would be incredibly helpful.

Best,
{{senderName}}`,
  },
  HM_OUTREACH_TEMPLATE,
];


// ─── Follow-up Templates ─────────────────────────────────────────────────────

export const FOLLOWUP_TEMPLATES: FollowUpTemplate[] = [
  {
    id: 'followup-1',
    name: 'First Follow-up (3–5 days)',
    daysAfter: 4,
    subject: 'Re: {{originalSubject}}',
    body: `Hi {{firstName}},

Just wanted to bump this up in case it got buried. I'd still love to connect and learn more about {{company}}.

Happy to work around your schedule — even a quick 10-minute intro call would be great.

{{senderName}}`,
  },
  {
    id: 'followup-2',
    name: 'Second Follow-up (1 week)',
    daysAfter: 7,
    subject: 'Re: {{originalSubject}}',
    body: `Hi {{firstName}},

I know inboxes get hectic — just one last nudge before I leave you alone! 😊

I'm genuinely excited about what {{company}} is building and would love to find out if there's a fit. If timing isn't right, no worries at all — I appreciate you taking a look.

Best,
{{senderName}}`,
  },
  {
    id: 'followup-3',
    name: 'Breakup Email (2 weeks)',
    daysAfter: 14,
    subject: 'Closing the loop — {{company}}',
    body: `Hi {{firstName}},

I'll keep this short — I've reached out a couple of times about opportunities at {{company}} but haven't heard back, so I assume the timing isn't right.

I'll stop following up after this, but if things change or a relevant role opens up, I'd genuinely love to reconnect. I'll be rooting for {{company}} either way!

All the best,
{{senderName}}`,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Replace {{variable}} placeholders in a template string
 */
export function applyTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

export function getTemplateVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set(Array.from(matches).map(m => m[1]))];
}
