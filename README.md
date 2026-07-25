# Planning — Church Volunteer Appointment & Service Planning System

A church service planning and volunteer scheduling app: leaders plan Sunday
services, build the service flow, schedule volunteers into roles, send
invitations, and volunteers accept or decline from their own dashboard.

## Tech stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend/DB:** Supabase (PostgreSQL, Auth, Realtime, Row Level Security)
- **Email:** Resend
- **Data:** TanStack Query + `@supabase/supabase-js` / `@supabase/ssr`
- **Deployment target:** Vercel + Supabase cloud

## Build status

- [x] **Phase 1** — scaffold, schema + RLS, auth, org creation & invites
- [x] **Phase 2** — People & Roles management
- [x] **Phase 3** — Services & service flow builder
- [x] **Phase 4** — Volunteer scheduling engine (draft-first invites, accept/decline,
      conflict + blockout detection, notifications, reminder cron)
- [x] **Phase 5** — Volunteer dashboard (list + calendar), blockout dates (add/edit/delete)
- [x] **Phase 6** — Messaging (per role group / role / service), in-app notification
      center, per-category email preferences, email reminders
- [x] **Phase 7** — Leader dashboard widgets, empty states, loading skeletons, print
      styles, seed data, README

## Getting started

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com) (free tier is
fine). You'll need:

- **Project URL** and **anon public key** — Project Settings → API
- **service_role key** (same page) — keep this secret; never expose it to
  the client

### 2. Apply the database migrations

In the Supabase SQL Editor, run each file in `supabase/migrations/` **in
order** (`0001` → the highest number present). Each one expects the
previous ones to already be applied.

Optionally also run `supabase/seed.sql` for demo data: 1 church, ~15 users
(all with password `password123`), 3 role groups, 4 upcoming services with a
mix of accepted/invited/declined/draft positions, a couple of blockout
dates, and a sample message thread. It inserts directly into `auth.users`,
so it only works via the SQL Editor (or `supabase db reset` locally) — not
through the REST API. Try `admin@gracechurch.demo` after seeding.

If you want to skip email confirmation while testing locally, go to
**Authentication → Settings** and turn off "Confirm email" (or confirm the
row manually: `update auth.users set email_confirmed_at = now() where
email = '...'`).

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` from step 1. `RESEND_API_KEY` is optional
during development — without it, emails are logged to the server console
instead of sent.

### 4. Install dependencies and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first person to
sign up and create an organization becomes its Admin; everyone else joins
via an emailed invite (Settings → Invite people, admin only).

### 5. Run tests

```bash
npm test
```

Exercises the real scheduling trigger and conflict-detection RPC against
your Supabase project — skips gracefully if `SUPABASE_SERVICE_ROLE_KEY`
isn't set.

### 6. Reminder emails (cron)

`POST /api/cron/reminders` sends 3-day and 1-day reminder emails to
non-responders and accepted volunteers. It requires an
`Authorization: Bearer <CRON_SECRET>` header matching your `CRON_SECRET`
env var. `vercel.json` already schedules this daily at 13:00 UTC when
deployed to Vercel (which auto-injects that header for you); for other
hosts, point any scheduler (cron-job.org, Supabase scheduled Edge
Function, etc.) at the same endpoint with that header.

## Project structure

```
supabase/
  migrations/        Numbered SQL migrations — schema, functions/RPCs, RLS, realtime
  seed.sql            Demo data (dev/local only)
src/
  app/
    (auth)/            Login, signup, shared auth server actions
    (app)/             Authenticated app shell — dashboard, people, roles,
                        services, messages, settings, etc.
    onboarding/        Create-organization flow
    invite/[token]/    Public invite-acceptance page
    auth/callback/     OAuth / email-confirmation redirect handler
  components/
    ui/                shadcn/ui primitives
    layout/            App shell, sidebar nav, topbar, notification bell
  lib/
    supabase/          Browser/server/admin Supabase clients + Proxy session refresh
    auth/               requireProfile / requireOrgProfile / requireAdmin helpers
    email/               Resend client + HTML templates
  types/database.types.ts   Hand-maintained Supabase type definitions
```

## Permission levels

- **Admin** — everything, including managing roles, people, and org settings
- **Leader** — create/edit services, schedule volunteers, send invites, message teams
- **Member** — view own schedule, accept/decline, set blockout dates, chat

Enforced at the database layer via Postgres Row Level Security — see
`supabase/migrations/0003_rls.sql`.

## Regenerating types

`src/types/database.types.ts` is hand-written to match the SQL migrations.
Once you have the Supabase CLI linked to your project, regenerate it with:

```bash
supabase gen types typescript --linked > src/types/database.types.ts
```

...then re-apply the file header comment and diff against migrations if
you've made manual edits.
