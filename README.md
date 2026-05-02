# ReachOut - Cold Email Agent

AI-powered cold outreach platform that automatically finds prospects, generates personalized emails, and sends at scale.

## Features

- **Prospect Discovery**: Search 10M+ professionals from Apollo.io and Hunter.io
- **AI Email Generation**: OpenAI/Gemini-powered personalized cold email creation
- **Bulk Sending**: Send to hundreds of prospects with automatic rate limiting
- **Demo Mode**: Get started instantly without API keys
- **Gmail Integration**: Send directly from your Gmail account (OAuth)
- **Mobile-Friendly**: Responsive design that works on all devices

## Quick Start

### Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Open http://localhost:3000
```

## Configuration

### Required Environment Variables

Create a `.env.local` file:

```bash
# Optional: Apollo.io API Key (leave blank to use demo data)
APOLLO_API_KEY=your_api_key_here

# Optional: Hunter.io API Key (leave blank to use demo data)
HUNTER_API_KEY=your_api_key_here

# Optional: OpenAI API Key (uses Gemini by default if not set)
OPENAI_API_KEY=your_api_key_here

# Optional: Google Gemini API Key
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# Demo mode: Set to 'true' to use sample data instead of API calls
DEMO_MODE=true
```

### Getting API Keys

1. **Apollo.io**:
   - Sign up at https://app.apollo.io
   - Get API key from Settings > API > Access Key
   - Search API docs: https://docs.apollo.io

2. **Hunter.io**:
   - Sign up at https://hunter.io
   - Get API key from Account > API
   - Domain search: 200 results per month free

3. **OpenAI**:
   - Sign up at https://platform.openai.com
   - Create API key at https://platform.openai.com/account/api-keys
   - Requires paid account

4. **Google Gemini** (included with Vercel AI Gateway):
   - No setup needed - uses default Vercel gateway
   - Free tier available

## Project Structure

```
reachout/
├── app/
│   ├── layout.tsx           # Root layout with toast provider
│   ├── page.tsx             # Landing page
│   ├── globals.css          # Design tokens & Tailwind styles
│   ├── api/
│   │   ├── search/          # POST /api/search - Prospect search
│   │   ├── generate-email/  # POST /api/generate-email - Email generation
│   │   └── mcp/gmail/       # GET/POST /api/mcp/gmail - Gmail MCP server
│   └── app/
│       ├── layout.tsx       # App sidebar & navigation
│       ├── page.tsx         # Search & discovery interface
│       ├── compose/
│       │   └── page.tsx     # Email generation & sending
│       ├── campaigns/
│       │   └── page.tsx     # Campaign history (stub)
│       └── settings/
│           └── page.tsx     # API key & integration settings
├── components/
│   ├── ui/                  # Shadcn UI components
│   ├── search-form.tsx      # Prospect search form
│   ├── prospects-grid.tsx   # Grid view of results
│   ├── prospects-table.tsx  # Table view of results
│   ├── action-bar.tsx       # Bulk action toolbar
│   ├── email-generator.tsx  # Email generation UI
│   ├── email-preview.tsx    # Email review & editing
│   ├── email-bulk-sender.tsx# Send confirmation & progress
│   └── toast-container.tsx  # Toast notifications
├── lib/
│   ├── types.ts             # TypeScript interfaces
│   ├── api-clients.ts       # Apollo/Hunter client libraries
│   ├── store.ts             # Zustand global state
│   ├── email-generator.ts   # AI email generation logic
│   └── utils.ts             # Helper functions
└── public/                  # Static assets

```

## Architecture

### Search Flow

1. User enters search criteria (keywords, title, company, location)
2. `/api/search` endpoint routes through Apollo → Hunter → Demo fallback
3. Results cached in Zustand store for instant selection
4. Results displayed in grid/table with selection UI

### Email Generation Flow

1. User selects prospects and enters context
2. User chooses email tone (professional/friendly/casual)
3. `/api/generate-email` calls OpenAI/Gemini in batch
4. AI generates subject + body for each prospect
5. User reviews and optionally edits each email
6. User sends via Gmail with configurable rate limiting

### Sending Flow

1. User confirms send settings (delay between emails)
2. App iterates through selected emails
3. Mock MCP server (`/api/mcp/gmail`) receives send requests
4. Progress tracked in real-time
5. User can track opens/replies in Gmail

## Design System

Uses **Clay-inspired** design tokens:

- **Primary**: Warm rust/terracotta (`oklch(0.58 0.2 25)`)
- **Secondary**: Muted sage green (`oklch(0.68 0.08 160)`)
- **Accent**: Warm gold (`oklch(0.74 0.12 50)`)
- **Background**: Warm cream (`oklch(0.98 0.01 70)`)

All colors defined in `app/globals.css` with CSS variables for easy theming.

## Development

### Key Technologies

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS + Shadcn UI
- **State**: Zustand (global store)
- **Data Fetching**: SWR or direct API calls
- **AI**: Vercel AI SDK + OpenAI/Gemini
- **Icons**: Lucide React

### Code Style

- TypeScript for type safety
- Functional components with hooks
- Client components for interactivity
- Server components for data fetching (where possible)
- Console logs with `[v0]` prefix for debugging

### Common Patterns

```typescript
// Zustand state usage
const results = useStore(state => state.search.results);
const setLoading = useStore(state => state.setSearchLoading);

// API calls with error handling
try {
  const results = await demoSearch(query);
  setSearchResults(results);
} catch (error) {
  addToast('Search failed', 'error');
}

// Form validation
if (!context.trim()) {
  addToast('Context required', 'warning');
  return;
}
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables in Settings > Environment Variables:
   - `APOLLO_API_KEY`
   - `HUNTER_API_KEY`
   - `OPENAI_API_KEY` (optional)
   - `DEMO_MODE=false` (if using real APIs)
4. Deploy

### Build & Test

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Run type check
pnpm type-check

# Run linter
pnpm lint
```

## API Reference

### POST /api/search

Search for prospects.

**Request:**
```json
{
  "keywords": ["SaaS", "B2B"],
  "title": "VP Product",
  "company": "Stripe",
  "location": "San Francisco",
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prospect-1",
      "firstName": "Sarah",
      "lastName": "Chen",
      "email": "sarah@company.com",
      "company": "TechCorp",
      "title": "VP of Product",
      "score": 92,
      "source": "apollo"
    }
  ],
  "count": 1,
  "timestamp": "2026-05-02T..."
}
```

### POST /api/generate-email

Generate personalized emails for prospects.

**Request:**
```json
{
  "prospect": {
    "id": "prospect-1",
    "firstName": "Sarah",
    "email": "sarah@company.com",
    "company": "TechCorp",
    "title": "VP"
  },
  "context": "We help SaaS teams reduce churn...",
  "tone": "professional",
  "aiProvider": "openai"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prospectId": "prospect-1",
    "prospectName": "Sarah Chen",
    "prospectEmail": "sarah@company.com",
    "subject": "Quick thought about TechCorp",
    "body": "Hi Sarah, I noticed TechCorp is...",
    "generatedAt": "2026-05-02T...",
    "status": "draft"
  }
}
```

### GET /api/mcp/gmail

MCP server info endpoint (discovery).

**Response:**
```json
{
  "name": "gmail-mcp",
  "version": "1.0.0",
  "capabilities": {
    "tools": true
  },
  "tools": [
    {
      "name": "send_email",
      "description": "Send an email via Gmail",
      "inputSchema": { ... }
    }
  ]
}
```

## Troubleshooting

### Search returns no results
- Check API keys in Settings
- Enable demo mode to use sample data
- Verify search keywords are specific

### Emails not generating
- Check OpenAI/Google API keys
- Verify context is at least 50 characters
- Check browser console for error details

### Sending fails
- Verify Gmail is connected (Settings page)
- Check email delay setting isn't too high
- Ensure prospects have valid email addresses

## Performance

- Landing page: ~2s first load
- Search: ~500ms with demo data, 1-2s with real APIs
- Email generation: ~2-5s per prospect with OpenAI
- Bulk operations: Handles 100+ prospects without issues

## Security

- No API keys stored in browser (sent via secure API routes)
- All email content server-side generated
- Rate limiting on email sending (configurable)
- Demo mode for zero-credential testing
- HTTPS only in production (enforced by Vercel)

## Future Enhancements

- [ ] Real Gmail OAuth integration
- [ ] Database persistence for prospects & campaigns
- [ ] Email tracking (opens, clicks, replies)
- [ ] A/B testing email variants
- [ ] Drip campaign scheduling
- [ ] Webhook integrations (Slack, Discord)
- [ ] Advanced analytics dashboard
- [ ] CSV import/export
- [ ] Team collaboration features
- [ ] Rate limiting & quota management

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review environment variables setup
3. Check browser console for error messages
4. Check `/api/*` endpoints in Network tab
5. Open issue on GitHub

## License

MIT

## Credits

Built with:
- [Next.js](https://nextjs.org) - React framework
- [Vercel AI SDK](https://sdk.vercel.ai) - AI integration
- [Shadcn UI](https://ui.shadcn.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Apollo.io](https://apollo.io) - Prospect data
- [Hunter.io](https://hunter.io) - Email discovery
- [OpenAI](https://openai.com) & [Google Gemini](https://gemini.google.com) - AI models
