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
  subject: 'Excited to contribute to software @ {{Company}} | SDE1 ~3YOE',
  body: `Hi {{firstName}},

Hope you're doing well.

I'm reaching out to explore **Software Engineer** opportunities at **{{Company}}**. I've a strong foundation in **Java**, industry experience working with **Azure** and have built **event-driven systems** using Kafka and Spring Boot for high-scale async workflows and enterprise finance use cases. Additionally, I have solved **650+ problems on Leetcode**, on my journey to improve problem-solving & DSA.

Will keep it brief to respect your time:

• Current role: Associate Software Engineer
• Experience: 3 years
• Technical Skillset: Java, Springboot, Microservices, Kafka, React, SQL DB, Docker, CI/CD (Azure, GitHub Actions)
• Current Employer: Shell
• Current Location: Bangalore
• Notice Period: 60 days
• Open to Relocation: Yes (Bangalore, Hyderabad, Gurgaon, Pune)

So, I would love to hear if there are any suitable openings at {{Company}} that align with my experience and skills.

PFA, my latest resume: [https://anubhavbagri.com/resume](https://anubhavbagri.com/resume)

Thanks for your time and attention!

Best Regards,

{{senderName}}
+91-8910145846
[Portfolio](https://anubhavbagri.com) | [LinkedIn](https://www.linkedin.com/in/anubhavbagri/) | [Leetcode](https://leetcode.com/anubhavbagri01)`,
};

export const HM_OUTREACH_TEMPLATE: EmailTemplate = {
  id: 'hm-outreach',
  name: 'Hiring Manager Outreach',
  description: 'Direct outreach to a hiring manager about a role',
  subject: 'Keen to contribute to software @ {{Company}} | SDE1 ~3YOE',
  body: `Hey {{firstName}},

Hope you're doing well.

I'll keep my request short to respect your time. I'm reaching out regarding potential SDE1/SDE2 opportunities at **{{Company}}**.

Key Highlights:

• Built **event-driven systems** using Kafka and Spring Boot for high-scale async workflows and enterprise finance use cases
• Strengthened **CI/CD + cloud infra (Docker, Terraform, Azure)**, improving reliability and reducing deployment overhead
• Led **AI-assisted engineering efforts at Shell**: automated code generation + workflow pipelines, reducing manual effort ~20%
• Built products like [CrowdLens](https://crowdlens.anubhavbagri.com/), along with MCPs & AI agents for outreach, job automation, and developer tooling
• Strong foundation in **Java** and have solved **650+** problems on [Leetcode](https://leetcode.com/anubhavbagri01), on my journey to improve problem-solving & DSA
• Also built **mobile + frontend apps (Flutter, React)**, so I think across product, not just backend

In case you don't believe me: [https://anubhavbagri.com](https://anubhavbagri.com)

I would really appreciate it if you could consider my application for any openings in your team at {{Company}}.

Thanks & Regards,

{{senderName}}
+91-8910145846
[LinkedIn](https://www.linkedin.com/in/anubhavbagri/) | [Github](https://github.com/anubhavbagri) | [Resume](https://anubhavbagri.com/resume)`,
};

// ─── Follow-up Templates ─────────────────────────────────────────────────────

export const FOLLOWUP_TEMPLATES: FollowUpTemplate[] = [
  {
    id: 'followup-1',
    name: 'First Follow-up (3–5 days)',
    daysAfter: 4,
    subject: 'Re: {{originalSubject}}',
    body: `Hi {{firstName}},

Just trying to follow up on my previous email: Did you get a chance to look at my application?

I'm targeting SDE1/SDE2 roles and am also available for any in-person interviews in Bangalore.

Thanks & Regards,
{{senderName}}`,
  },
  {
    id: 'followup-2',
    name: 'Second Follow-up (1 week)',
    daysAfter: 7,
    subject: 'Re: {{originalSubject}}',
    body: `Hi {{firstName}},

Checking in to see if you got the opportunity to see my last email. I've a knack for writing object-oriented code and I think I'd be a great fit for any SDE1 openings at {{Company}}.

Best,
{{senderName}}`,
  },
  {
    id: 'followup-3',
    name: 'Breakup Email (2 weeks)',
    daysAfter: 14,
    subject: 'Closing the loop — {{company}}',
    body: `Hi {{firstName}},

The industry standard of follow-ups is approximately 7 times, and this is my 3rd one. But I know how annoying it can get so I don't want to overstep.

Do let me know whether or not I should keep following up!

Thank you!

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
  const lower = Object.fromEntries(
    Object.entries(variables).map(([k, v]) => [k.toLowerCase(), v])
  );
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => lower[key.toLowerCase()] ?? `{{${key}}}`);
}

function getTemplateVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set(Array.from(matches).map(m => m[1]))];
}
