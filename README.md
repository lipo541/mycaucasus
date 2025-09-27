# mycaucasus

Next.js application with a strict component architecture, documented design tokens, and AI‑assisted development guidelines.

## Key Internal Docs

| Topic                           | File                           |
| ------------------------------- | ------------------------------ |
| Design Tokens                   | `docs/design-tokens.md`        |
| Coding & Structural Style Guide | `docs/coding-style.md`         |
| Copilot / AI Rules              | `docs/copilot-instructions.md` |
| Header Comment Templates        | `docs/header-snippet.ts.txt`   |

## Component / Folder Pattern

One component per folder (lowercase / kebab if multi-word):

```
src/components/<domain-group>/<component>/<component>.tsx
src/components/<domain-group>/<component>/<component>.module.css
```

Example:

```
src/components/navigation/navbar/navbar.tsx
src/components/navigation/navbar/navbar.module.css
```

Grouping: multiple related siblings live under a plural domain folder (`navigation/`, `notifications/`, `profile/`). Never put raw component `.tsx` directly under `components/`.

Props vs Context (summary): use props for 1–2 level simple data; context only when 3+ consumer branches or cross‑cutting state (see `docs/coding-style.md §6.1`).

Responsive (summary): Grid-first for multi‑axis layouts; flex for one dimension. Standard breakpoints: 640, 768, 1024, 1280, 1536. No inline styles—use module CSS (see `docs/coding-style.md §16`).

AI / Copilot (summary): enforce folder pattern, reject ad-hoc breakpoints & inline styles, suggest grid for complex layout, recommend context only after threshold. Full details: `docs/copilot-instructions.md`.

Contribution Workflow:

1. Scaffold folder + `.tsx` + `.module.css`.
2. Add header snippet if orchestrating.
3. Skeleton render → styles with tokens.
4. Implement logic; evaluate context need.
5. Responsive check (320→1920, no horizontal scroll).
6. Commit (`scope: action`).

Refactor Triggers: file >250 lines; 3+ duplicate conditionals; prop chain >2 levels; inline style appears.

---

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

## Project Structure (High-Level)

```
src/
	app/          # Next.js App Router (routes, layouts, server components)
	components/   # One-folder-per-component (UI + CSS Modules)
	config/       # Static configuration (feature flags, hero panels)
	lib/          # Reusable logic (Supabase client, utils, bus)
	...
docs/           # Internal documentation
scripts/        # Tooling & maintenance scripts
public/         # Static assets (images, flags, hero media)
```

## Create a New Component (Example)

```
src/components/hero/hero-banner/hero-banner.tsx
src/components/hero/hero-banner/hero-banner.module.css
```

```tsx
import styles from "./hero-banner.module.css";

export function HeroBanner({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <section className={styles.root}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </section>
  );
}
```

```css
.root {
  display: grid;
  gap: 16px;
  text-align: center;
}
@media (min-width: 768px) {
  .root {
    gap: 24px;
  }
}
.title {
  font-size: clamp(1.75rem, 2.6vw, 3rem);
}
.subtitle {
  opacity: 0.75;
}
```

## Formatting & Editor

Workspace settings (`.vscode/settings.json`) enforce format on save, import organization, absolute import preference (`@/`), and CSS Modules IntelliSense.

## Extending Design Tokens

Add new tokens to `docs/design-tokens.md` first; then consume. Avoid scattering raw values.

## Accessibility Snapshot

Focus visible, semantic elements, labeled controls. Avoid div-only interactive patterns.

## Performance Snapshot

Use server components for pure data fetch; context sparingly; lazy-load heavy below-the-fold UI.

---

## Learn More (External)

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js Tutorial](https://nextjs.org/learn)
- [Next.js GitHub](https://github.com/vercel/next.js/)

## Deploy on Vercel

Quickest deployment path: connect repo → set environment vars (`NEXT_PUBLIC_SUPABASE_URL`, keys) → deploy. More: [Next.js deployment docs](https://nextjs.org/docs/deployment).

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
