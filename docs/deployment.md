# Deploying to Supabase + Vercel

This guide sets up a **dev** environment that updates automatically on every push to the `dev` branch.

```
git push origin dev
        │
        ▼
GitHub Actions (.github/workflows/deploy-dev.yml)
  1. CI          lint · typecheck · unit tests · migrations + RLS tests on a throwaway database
  2. migrate     supabase db push   → applies new files in supabase/migrations to the hosted project
  3. deploy      vercel build + deploy --prod
```

The pipeline deploys, not Vercel's Git integration (`vercel.json` turns that off), so the database schema is
always updated **before** the code that depends on it goes live.

You'll need about 30 minutes and accounts on [supabase.com](https://supabase.com), [vercel.com](https://vercel.com)
(sign in with GitHub) and the GitHub repository.

---

## 1. Supabase project

1. **Create the project.** Dashboard → *New project*.
   - Name: `workers-app-dev`
   - Region: **Central EU (Frankfurt)**, the closest to Georgia (Vercel functions are pinned to Frankfurt too).
   - Database password: generate one and **save it**. You'll need it as `SUPABASE_DB_PASSWORD`.
2. **Collect the values you'll need later:**

   | Value | Where to find it | Used as |
   | --- | --- | --- |
   | Project ref (e.g. `abcdefghijklmnop`) | Project Settings → General | `SUPABASE_PROJECT_ID` |
   | Project URL (`https://<ref>.supabase.co`) | Project Settings → Data API (or the *Connect* button) | `NEXT_PUBLIC_SUPABASE_URL` |
   | Publishable key (`sb_publishable_…`) | Project Settings → API Keys | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
   | Personal access token | Avatar → Account preferences → Access Tokens → *Generate new token* | `SUPABASE_ACCESS_TOKEN` |

   Never put the **secret** / `service_role` key anywhere in this project. The app doesn't need it.
3. **Create the schema now** (once, from your machine), so the first Vercel build has tables to read:
   ```bash
   pnpm exec supabase login                       # opens the browser
   pnpm exec supabase link --project-ref <ref>    # asks for the database password
   pnpm exec supabase db push                     # applies supabase/migrations (no demo data)
   ```
   After this, the pipeline applies new migrations automatically.
4. **Auth settings:** Authentication → *Sign In / Providers* → **Email**:
   - *Confirm email*: **on** (the default).
   - *Minimum password length*: **8** (matches the app's validation).
5. **E-mail delivery (recommended).** Supabase's built-in mailer only sends to members of your Supabase team
   and only a few per hour, so other people's sign-up e-mails won't arrive. For real users, set up custom SMTP:
   - Create a free [Resend](https://resend.com) account (or Brevo, Postmark…) and verify a sending domain.
   - Authentication → *Emails* → *SMTP Settings* → enable and fill in host/port/user/password and the sender address.
   - Optional: under *Emails → Templates* you can translate the templates into Georgian.

   For a quick first test you can skip this and register with the e-mail address you use for Supabase.

URL settings come in step 3, once you know the Vercel address.

---

## 2. Vercel project

1. Vercel dashboard → *Add New…* → *Project* → import **toka16/workers-app**.
   Next.js, pnpm and the build command are detected automatically.
2. Before clicking *Deploy*, open **Environment Variables** and add (for the *Production* environment):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |
   | `NEXT_PUBLIC_SITE_URL` | leave for now, set in step 4 |

3. Click **Deploy**. This first build is the only one Vercel may trigger itself; Git deployments are turned
   off in `vercel.json`. If no build starts, that's fine: the pipeline does the first deployment in step 5.
   Note the domain, e.g. `https://workers-app-abc.vercel.app` (Project → Settings → Domains; you can rename it
   or attach your own domain there).
4. Project → Settings → Environment Variables → add `NEXT_PUBLIC_SITE_URL` = that domain (no trailing slash).
5. **Get the IDs for GitHub Actions.** Run this in the project folder on your machine:
   ```bash
   pnpm dlx vercel@latest login
   pnpm dlx vercel@latest link        # choose the existing "workers-app" project
   cat .vercel/project.json           # {"projectId":"prj_…","orgId":"team_… or user id"}
   ```
   `.vercel/` is git-ignored. The values become `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID`.
6. **Create a token:** Vercel → Account Settings → *Tokens* → *Create* (scope: your account or team).
   This is `VERCEL_TOKEN`.

---

## 3. Point Supabase Auth at the Vercel domain

Supabase → Authentication → **URL Configuration**:

- **Site URL**: `https://workers-app-abc.vercel.app`
- **Redirect URLs**: add `https://workers-app-abc.vercel.app/**`

Without this, confirmation and password-reset links send people to `localhost`.

---

## 4. GitHub secrets

Repository → Settings → **Environments** → *New environment* → name it **`dev`**.
Inside it, add these **environment secrets**:

| Secret | Value |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | personal access token from 1.2 |
| `SUPABASE_DB_PASSWORD` | database password from 1.1 |
| `SUPABASE_PROJECT_ID` | project ref from 1.2 |
| `VERCEL_TOKEN` | token from 2.6 |
| `VERCEL_ORG_ID` | `orgId` from 2.5 |
| `VERCEL_PROJECT_ID` | `projectId` from 2.5 |

Or with the GitHub CLI (`gh auth login` first):

```bash
for name in SUPABASE_ACCESS_TOKEN SUPABASE_DB_PASSWORD SUPABASE_PROJECT_ID VERCEL_TOKEN VERCEL_ORG_ID VERCEL_PROJECT_ID; do
  gh secret set "$name" --env dev --repo toka16/workers-app   # paste the value when prompted
done
```

Optional: in the `dev` environment settings, restrict *Deployment branches* to `dev`.

---

## 5. Deploy

The `dev` branch already exists on GitHub. Start the first automated deployment either by pushing to it or from
GitHub → **Actions** → *Deploy dev* → **Run workflow** (branch `dev`).

From then on:

```bash
git switch dev
# …make changes…
git commit -am "Describe the change"
git push            # → CI → migrations → live on Vercel in a few minutes
```

A nicer flow is feature branches → pull request into `dev` (CI runs on the PR) → merge → automatic deploy.

### Changing the database

```bash
pnpm exec supabase migration new add_something   # creates supabase/migrations/<timestamp>_add_something.sql
# write the SQL, then locally:
make db-reset && make db-test && make types      # rebuild local DB, run RLS tests, regenerate TS types
git add -A && git commit -m "Add something" && git push
```

Never edit a migration that has already been pushed; add a new one. The pipeline applies only new files.

---

## 6. Check that it works

1. Open the Vercel URL: the landing page shows 0 workers. Production has no demo data, which is expected.
2. *Join as a worker* → register → open the confirmation e-mail → you land on the profile form.
3. Fill in name, a contact, a city and a category, add a service and a photo, then **Publish** on the overview page.
4. Log out. Search for your city: your profile appears and the contact buttons work.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Build fails with `relation … does not exist` / `permission denied` | Migrations weren't applied: run `supabase db push` (step 1.3) or check the *migrate* job log. |
| Confirmation e-mail never arrives | Built-in mailer limits; configure SMTP (step 1.5). Check Supabase → Logs → Auth. |
| E-mail link opens `localhost` | Site URL / Redirect URLs in step 3. |
| *deploy* job: `Project not found` | `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` don't match the token's account/team. |
| Site is slow after a quiet week | Free Supabase projects pause after 7 days without activity; restore it from the dashboard. |

## Later: a production environment

When you're ready for a real production site, keep `dev` as-is and add a second, separate stack:

1. Create a second Supabase project (`workers-app-prod`) and a second Vercel project.
2. Copy `deploy-dev.yml` to `deploy-prod.yml`, trigger it on `main`, and use a GitHub environment `prod` with its
   own six secrets.
3. Release by merging `dev` into `main`.
