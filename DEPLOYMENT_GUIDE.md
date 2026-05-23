# Deployment Guide

This guide documents the production path for Secret Sip Feed.

## 1) Prerequisites

- Node.js 20+
- npm 10+
- Supabase project
- Vercel account linked to this GitHub repository

## 2) Local validation

```bash
npm ci
npm run test
npm run build
```

## 3) Required environment variables

Configure in Vercel project settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 4) Supabase setup

1. Apply SQL migrations in `/supabase/migrations`.
2. Deploy edge functions in `/supabase/functions`.
3. Confirm RLS policies are enabled for production tables.

## 5) Vercel deployment

1. Import this repository into Vercel.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add environment variables from step 3.
6. Deploy to create the Website-in-Test URL.

## 6) Deployment automation

- GitHub Actions workflow: `.github/workflows/vercel-deploy.yml`
- Preview deployments run for pull requests.
- Production deployment runs on push to `main` and `workflow_dispatch`.
- CI gate runs `npm run test` and `npm run build` before deploy.

### Required GitHub secrets

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
