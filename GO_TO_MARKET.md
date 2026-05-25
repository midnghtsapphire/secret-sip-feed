# Go-To-Market

## Product summary

Secret Sip Feed helps creators and consumers discover, save, and remix trending drink recipes from social channels in one searchable workflow.

## Value analysis

- **User value:** fast discovery + import flow instead of manual note-taking.
- **Creator value:** visibility for drink ideas and remix formats.
- **Business value:** high-frequency repeat usage around trend cycles.

## Priority goals (S2M framing)

1. Ship a stable web experience with auth + favorites + import flow.
2. Convert recurring users with premium recipe collections and creator tools.
3. Reach a path toward **$10M in 3 years** via subscriptions, sponsored placements, and affiliate beverage links.

## Target segments

- Gen Z and millennial social recipe followers
- Home barista and coffee customization communities
- Lifestyle creators sharing recipe content

## Revenue model

- Freemium access to core feed
- Premium subscription for advanced filters/collections
- Sponsored placements for drink brands
- Affiliate links for ingredients and equipment

## Competitive landscape

- Generic recipe sites lack social-native import flows.
- Video social platforms have discovery but weak structured recipe storage.
- Secret Sip Feed differentiates by combining trend discovery, structured data, and personal collections.

## Launch milestones

1. Stabilize production deployment on Vercel + Supabase.
2. Launch social import campaigns with creator partners.
3. Track conversion funnel (visit -> signup -> favorite -> repeat usage -> paid).

## Metrics

- Weekly active users
- Signup conversion rate
- 30-day retention
- Favorites saved per active user
- Paid conversion rate

## Research engine

- **Product signal sources:** TikTok/Instagram/Lemon8 trend monitoring, user search terms, save/favorite patterns.
- **Operational signal sources:** Supabase auth funnel events, import success rates, recipe publish cadence.
- **Decision cadence:** weekly trend synthesis and monthly roadmap reprioritization from observed conversion deltas.

## Suggestions

1. Add creator profile pages with trackable referral links to improve sponsored campaign attribution.
2. Add premium “batch import + organizer” workflows for high-intent power users.
3. Add ingredient-price overlays in recipe cards to strengthen affiliate conversion potential.

## Assets inventory

- Frontend app routes (`/src/pages` + `/src/components`) for browse, auth, favorites, recipe management, and import workflows.
- Supabase migrations and edge functions (`/supabase/migrations`, `/supabase/functions`) powering data, auth, and extraction.
- Deployment automation (`/.github/workflows/vercel-deploy.yml`) for preview and production Vercel releases.
- Brand and operational docs (`README.md`, `DEPLOYMENT_GUIDE.md`, `BRAND_GUIDELINES.md`, `SECURITY.md`).

## Artifacts inventory

- Website in Test URL: `https://secret-sip-feed.vercel.app`
- Baseline validation artifacts: `npm run test` (`scripts/test-baseline.js`) and `npm run build` (`scripts/build-baseline.js` + Vite build)
- Market narrative artifact: this GTM document with value, goals, revenue model, and research-backed launch plan
- Release history artifact: `CHANGELOG.md`
