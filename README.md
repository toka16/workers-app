# Xelosani — find a home-service worker

A mobile-first website where home-service workers (plumbers, electricians, cleaners…) publish a profile with their
services, prices, work photos, cities and contact details, and anyone can search and contact them directly.
No chat, no orders, no visitor accounts. Georgian (default, `/`) and English (`/en`).

- **Next.js 16** (App Router, Cache Components, Partial Prefetching, Turbopack) + **React 19**
- **Tailwind CSS 4** design tokens, Radix primitives, `motion` animations, `next-intl`
- **Supabase** Postgres + Row Level Security, Auth and Storage — used only through the SDK, no custom backend
- **Repository pattern**: the UI depends on interfaces; providers are swappable per capability

## Quick start (Docker)

Requirements: Docker, Node 24 + pnpm (only for the Supabase CLI on the host).

```bash
pnpm install          # installs the Supabase CLI locally
make up               # supabase start + docker compose up
```

| What            | URL                                   |
| --------------- | ------------------------------------- |
| App             | http://localhost:3000                 |
| Supabase Studio | http://localhost:54323                |
| Mailpit (email) | http://localhost:54324                |

Migrations and demo data (`supabase/seed.sql`, 12 workers) are applied automatically on first start.
Every demo worker can log in with password `password123`, e.g. `nino.kapanadze@example.com`.
Sign-up confirmation and password-reset e-mails land in Mailpit.

Other commands: `make help` (`down`, `logs`, `db-reset`, `db-test`, `types`, `test`, `lint`, `e2e`, `prod`).

### Without Docker for the app

```bash
cp .env.example .env.local
pnpm db:start
pnpm dev
```

## Project layout

```
src/
  app/[locale]/(site)/        public pages: landing, /workers search, /workers/[slug] profile
  app/[locale]/auth/          login, register, forgot/reset password
  app/[locale]/dashboard/     worker area: overview, profile, services, portfolio, account, preview
  app/api/auth/callback/      e-mail link / PKCE code exchange
  actions/                    Server Actions (validated with zod, re-authorize every call)
  components/                 ui/ primitives + feature components
  domain/                     framework-free models, zod schemas, rules
  repositories/               repository INTERFACES (auth, workers, services, portfolio, reference, storage)
  infrastructure/             provider implementations + composition roots
    supabase/                 Supabase adapters (the only place @supabase/* may be imported)
    memory/                   in-memory adapters (tests, prototyping)
    container.server.ts       picks providers for server code
    container.client.ts       picks providers for browser code (direct uploads)
  lib/data/                   cached public reads + dashboard data access
  messages/{ka,en}.json       translations
  proxy.ts                    locale routing, session refresh, dashboard guard
supabase/
  migrations/                 schema, RLS, storage buckets & policies, search RPC
  seed.sql                    local demo data
  tests/rls.test.sql          pgTAP security tests
tests/unit, tests/e2e         Vitest and Playwright
```

See [docs/architecture.md](docs/architecture.md) for the security model, caching and how to swap or mix providers.

## Quality checks

```bash
pnpm lint && pnpm typecheck   # includes an import-boundary rule for the repository pattern
pnpm test                     # unit tests (domain + in-memory repositories)
pnpm db:test                  # RLS tests: anon can't write, worker A can't touch worker B
pnpm test:e2e                 # Playwright, desktop + mobile, against http://localhost:3000
```

## Deploying (Vercel Hobby + Supabase Free)

1. **Supabase**: create a project, then
   ```bash
   pnpm exec supabase login
   pnpm exec supabase link --project-ref <ref>
   pnpm exec supabase db push        # applies supabase/migrations (not the seed)
   ```
   In *Authentication → URL configuration* set **Site URL** to your Vercel domain and add
   `https://<your-domain>/**` to **Redirect URLs**. Configure a real SMTP sender for production e-mails.
2. **Vercel**: import the repository and set the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` – project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` – publishable (anon) key
   - `NEXT_PUBLIC_SITE_URL` – e.g. `https://xelosani.vercel.app`
3. Deploy. Public pages are prerendered at build time, so the database must be reachable from the build.

Free-tier notes: images are resized in the browser before upload (Supabase image transformations are a paid
feature, and Next.js image optimization is disabled to stay within Vercel's Hobby quota). Free Supabase projects
pause after a week without traffic.

## Managing cities and categories

Reference data lives in `public.cities` and `public.categories`. Nobody can change it through the public API.
Add or edit rows in Supabase Studio (or with a new migration); public pages pick changes up within a day, or
immediately after a redeploy.
