# Secret Sip Feed

Secret Sip Feed is a full-stack web app for discovering, importing, and managing viral drink recipes. It combines a React + Vite frontend with Supabase auth, database storage, and serverless extraction functions.

## What this repository does

- Public feed of curated drink recipes
- User authentication (sign up / sign in)
- Favorites management for signed-in users
- Recipe management workflow (create/edit/delete/toggle visibility)
- Social URL/image import flow for recipe extraction
- Supabase-backed data model and edge functions

## Website in test

- **Current public preview:** https://secret-sips.lovable.app
- **Website in Test (Vercel):** `https://secret-sip-feed.vercel.app` (set during Vercel project onboarding)
- **Deployment automation:** `.github/workflows/vercel-deploy.yml` (preview + production)
- **Deployment automation reference:** see `/DEPLOYMENT_GUIDE.md` for CI + Vercel setup steps

## Quick start

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Baseline validation commands

```bash
npm run test
npm run build
npm run lint
```

## Environment

Create `.env.local` with app-specific values if you override defaults:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Revvel-standard docs

- [CHANGELOG.md](./CHANGELOG.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [GO_TO_MARKET.md](./GO_TO_MARKET.md)
- [BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md)
- [SECURITY.md](./SECURITY.md)
