# mycaucasus

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Environment

Create a `.env.local` file in the project root (it's git-ignored) and set the required Supabase variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Server-only (optional in this repo):
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can copy `.env.example` to get started.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Analytics & Visit Tracking

The project includes a lightweight, privacy‑respecting visit tracking system:

- Table: `public.visit_events`
- Logged fields (simplified): timestamp (UTC), `ymd` date, path, hashed IP, hashed user agent, session_id (UUID per browser), country (if derivable later).
- Client tracker: a small component (`VisitTracker`) mounted in `(site)/layout.tsx` which sends a POST to `/api/metrics/visit` once per session per path.
- Aggregation: admin stats endpoint and a `visit_series` RPC (optional) surface daily totals, unique sessions, and 30‑day averages.
- Privacy: IP + UA are hashed with a salt (`METRICS_HASH_SALT`) and never stored in plain text.

### Environment Variables

Add to `.env.local` (choose a good random salt – do NOT rotate casually, or historical uniqueness breaks):

```
METRICS_HASH_SALT=changeme-long-random
```

### Enabling RLS (Row Level Security)

RLS protects the raw analytics table. The server uses the Supabase service role key (bypasses RLS) to insert rows; no direct client inserts should happen.

Migration file added: `scripts/sql/20250918_enable_rls_visit_events.sql`

Run it in the Supabase SQL editor (or psql):

```
-- Enable and lock down
begin;
alter table public.visit_events enable row level security;
revoke all on table public.visit_events from anon;
-- (Optional) revoke sequence permissions if present
commit;
```

The migration file also contains a commented composite index you can enable if you expect large volume:

```
create index if not exists idx_visit_events_ymd_session on public.visit_events (ymd, session_id);
```

### Adding an Admin Read Policy (Optional Future)

If later you want authenticated admins to query raw rows directly (not only via server endpoints), create a policy like:

```
create policy "allow_admin_read_visit_events" on public.visit_events
	for select using (
		auth.role() = 'authenticated' and
		exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
	);
```

You would need to maintain a `user_roles` table (or adapt the predicate to your auth metadata structure).

### Opt‑Out (Recommended Enhancement)

To offer users an analytics opt‑out, gate the client call in `trackVisit` behind a user preference flag stored locally or in profile metadata.

### Why Not Google Analytics?

This approach avoids third‑party cookies, minimizes data retention, and stores only pseudonymized fingerprints—simplifying GDPR/CCPA posture.

### Retention (Automatic Pruning)

Old visit rows are not required indefinitely. A migration file `scripts/sql/20250918_visit_events_retention.sql` installs:

- A pruning function: `public.prune_visit_events(limit_batch int)` deleting rows older than 180 days in small batches.
- A pg_cron scheduled job (`prune_visit_events_job`) that runs daily at 02:17 UTC.

Adjust window:

1. Edit the `interval '180 days'` inside the function.
2. Re-run the function definition.
3. (Optional) Re-schedule with a different cron expression, e.g. `0 3 * * *` for 03:00 UTC.

Run pruning manually anytime:

```
select public.prune_visit_events();
```

If pg_cron is missing, enable it first (Supabase project SQL):

```
create extension if not exists pg_cron with schema public;
```

To remove the job:

```
select cron.unschedule(jobid) from cron.job where jobname='prune_visit_events_job';
```

