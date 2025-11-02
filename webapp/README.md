# Agentic Social Command Center

Private AI assistant that discovers social trends, generates cross-platform content (English + Urdu), and automates publishing across Facebook, Instagram, X, YouTube, Pinterest, Threads, and more. Designed for single-operator use with a secure admin console.

## Features

- **Trend intelligence**: Aggregates Google Trends, Reddit, and YouTube data with regional + category filters and manual approval workflow.
- **Content studio**: GPT-style copywriter produces platform-specific posts, hashtags, and image prompts with customizable tone, persona voice, and language.
- **Scheduling + autopublish**: Queue content per platform, attach stored credentials, trigger immediate pushes, or run via scheduled cron.
- **Account vault**: Store access and refresh tokens for each platform in Prisma (SQLite locally, switch to Postgres in production). Tokens never leak to the browser.
- **Extensible connectors**: Included publishers for Facebook, Instagram, X, Pinterest, and placeholder for Threads; each uses official/freemium APIs where available.

## Tech Stack

- Next.js 14 (App Router) + React + Tailwind CSS
- Prisma ORM (SQLite for local dev, migrate to Postgres/MySQL via `DATABASE_URL`)
- OpenAI / compatible API for content generation (bring your own key)
- TypeScript end-to-end

## Getting Started

```bash
cp .env.example .env
# add your API keys + social tokens

npm install
npm run db:push      # sets up Prisma schema
npm run dev
```

Visit `http://localhost:3000` to access the dashboard.

### Required Environment Variables

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma datasource (SQLite by default) |
| `OPENAI_API_KEY` / `OPENROUTER_API_KEY` | Text generation models |
| `YOUTUBE_API_KEY` | Fetch trending videos (optional, recommended) |
| `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID` | Facebook publishing |
| `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Instagram publishing |
| `TWITTER_*` tokens | X/Twitter publishing |
| `PINTEREST_ACCESS_TOKEN`, `PINTEREST_BOARD_ID` | Pinterest publishing |

Populate the tokens relevant to the platforms you plan to automate. Leave unused ones empty.

## Deployment

Ready for Vercel:

```bash
npm run build
vercel deploy --prod --yes --name agentic-360f70ba
```

Schedule `GET /api/cron` with Vercel Cron (or similar) to process queued posts automatically.

