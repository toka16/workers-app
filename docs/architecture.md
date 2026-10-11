# Architecture

## Layers

```
 UI (app/, components/)          Server Components, Client Components, Server Actions
        │  depends only on
        ▼
 repositories/  (interfaces)     AuthRepository, WorkerRepository, ServiceRepository,
        ▲                        PortfolioRepository, ReferenceRepository, FileStorage
        │  implemented by
 infrastructure/<provider>/      supabase/, memory/, …
        ▲
        │  wired by
 infrastructure/container.*.ts   composition roots (server / browser)
```

- `domain/` holds plain types, zod schemas and business rules (profile completeness, publish requirements).
  It has no framework or vendor imports.
- `repositories/` declares what the app needs, in domain terms. Errors are `DomainError`s with stable codes
  that the UI translates (`errors.*` messages).
- An ESLint rule (`no-restricted-imports` in `eslint.config.mjs`) fails the build if anything outside
  `src/infrastructure/supabase` imports `@supabase/*`, or if app code imports a concrete provider.

## Swapping and mixing providers

Each capability is chosen independently with an environment variable:

| Variable                        | Capability                          | Built-in values      |
| ------------------------------- | ----------------------------------- | -------------------- |
| `NEXT_PUBLIC_AUTH_PROVIDER`     | `AuthRepository`                    | `supabase`, `memory` |
| `NEXT_PUBLIC_DB_PROVIDER`       | workers, services, portfolio, reference data | `supabase`, `memory` |
| `NEXT_PUBLIC_STORAGE_PROVIDER`  | `FileStorage`                       | `supabase`, `memory` |

To add a provider (for example S3 / Cloudflare R2 for images):

1. Implement the interface, e.g. `src/infrastructure/s3/file-storage.ts implements FileStorage`.
2. Export a provider object (`ServerProvider` / `BrowserProvider` from `infrastructure/provider.ts`) that
   implements only the capabilities it offers (`createStorage`).
3. Register it in `container.server.ts` and `container.client.ts`.
4. Set `NEXT_PUBLIC_STORAGE_PROVIDER=s3`.

Data providers never build file URLs themselves: the container passes `FileStorage.getPublicUrl` into the data
provider, so a Supabase database can store paths of files that live in any storage provider.

**Caveat when replacing auth.** Ownership is enforced by Postgres Row Level Security using `auth.uid()` from the
Supabase JWT. If you keep Supabase as the database but move authentication elsewhere, configure Supabase
[third-party auth](https://supabase.com/docs/guides/auth/third-party/overview) (Clerk, Firebase, Auth0, Cognito…)
so the database still receives a verifiable user id — or move the same ownership checks into the new data
provider. The in-memory provider shows the rules a provider must enforce.

## Security model

There is no custom backend; the browser and the Next.js server talk to Supabase with the public (publishable)
key. All protection lives in the database (`supabase/migrations`), covered by `supabase/tests/rls.test.sql`:

- `cities`, `categories`: read-only for everyone.
- `worker_profiles`: readable when `is_published` (or by the owner); updatable only by the owner;
  column privileges stop owners from touching `id`, timestamps or generated columns; rows are created by an
  `auth.users` trigger and deleted only through `delete_my_account()`.
- `worker_cities`, `worker_categories`, `worker_services`, `portfolio_images`: readable when the parent profile is
  visible; insert/update/delete only where `worker_id = auth.uid()`.
- A trigger refuses to publish a profile without a name, a contact, a city and a category.
- Storage buckets `avatars` and `portfolio` are public for reads by URL, limited to 5 MB images, and writable only
  inside the `<user id>/` folder.

Server Actions re-check the session on every call (never trusting the client) and validate input with zod;
the proxy only does optimistic redirects. Sessions are verified with `getClaims()` (JWT signature check).

## Rendering and caching (Next.js 16 Cache Components)

- Public data is read with a **session-less** Supabase client inside `"use cache"` functions
  (`src/lib/data/public.ts`), so the landing page, search shell and profiles are prerendered/ISR-cached.
- Dashboard Server Actions call `updateTag()` for the worker and the `workers` tag, so changes appear on public
  pages immediately.
- Anything that reads cookies or search params renders behind `<Suspense>`/`loading.tsx`. The header's
  "log in / my profile" button reads the session in the browser so public pages stay static.
- Images are uploaded straight from the browser to storage (no file bytes through Vercel functions), after being
  resized to WebP (1600px + 480px thumbnail; 512px square avatars).

## Local networking

The app container reaches Supabase on the host through `host.docker.internal`, while the browser uses
`127.0.0.1:54321`. Two consequences are handled in code:

- `SUPABASE_INTERNAL_URL` is used for server-side requests, `NEXT_PUBLIC_SUPABASE_URL` for the browser and for
  every public file URL.
- `@supabase/ssr` derives the auth cookie name from the URL host, so both clients pin it to
  `sb-workers-auth-token` (`infrastructure/supabase/env.ts`).
