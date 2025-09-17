# Metrics & Analytics Layer

This document explains the new analytics foundation.

## Overview
Implemented baseline privacy-friendly visit tracking:
- visit_events table (see `scripts/sql/metrics_visit_events.sql`)
- POST /api/metrics/visit endpoint logs one event per page load
- GET /api/admin/metrics/visits?days=30 aggregates visits + unique sessions
- Client auto tracking via `VisitTracker` component (mount once in public layouts)
- SVG chart (`VisitsChart`) surfaces 30‑day trend inside admin dashboard

## Definitions
- Visit: A single logged page load (per session per path)
- Unique: Distinct session_id count for the day
- Session: Generated UUID stored in localStorage (`mc.vs.sid`)

## Adding Tracker to Layouts
Example (site layout):
```tsx
import VisitTracker from '@/components/metrics/VisitTracker';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <>
    <VisitTracker />
    {children}
  </>;
}
```

(Already imported for admin widgets chart, ensure not to double mount if adding globally.)

## Extending Metrics
Planned expansions:
1. Content Engagement: track events (e.g., `content_view`, `like`, `share`).
2. Conversion Funnel: track registration steps, completed pilot profile, booking flows.
3. Retention Cohorts: store first_seen date per session_id → weekly retention queries.
4. Geographic Stats: add country via edge geo headers (if available) hashed or generalized.
5. Performance: log first contentful paint bucket counts (fast/avg/slow) aggregated daily.

Each new event type could reuse a generalized `events` table or separate tables to keep write paths hot and indexes slim.

## Security & Privacy
- IP/UA hashed (truncated SHA256) with optional salt `METRICS_HASH_SALT`.
- No personal data stored in visit_events.
- Enable RLS after validating ingestion throughput.

## Next Ideas
- Add `uniqueVisitorsChange` vs previous 30 days (stat card delta)
- Weekly / monthly rollups materialized view for faster queries
- Heatmap of hours (0-23) for traffic distribution
- Rolling 7‑day moving average overlay on chart
- Export CSV endpoint for offline analysis

## Maintenance
- Consider pruning events older than 180 days:
```sql
delete from visit_events where ts < now() - interval '180 days';
```
- Add cron (Supabase scheduled function) for regular pruning.

## Troubleshooting
- Empty chart? Ensure SQL migration is applied.
- 500 on logging: verify `SUPABASE_SERVICE_ROLE_KEY` env present on server.
- All sessions 'pending'? Add client-sent session id header/body in future enhancement.

## Roadmap Table (High-Level)
| Feature | Table | Endpoint | Priority |
|---------|-------|----------|----------|
| Visits | visit_events | /api/metrics/visit | Done |
| Daily Series | visit_events (RPC) | /api/admin/metrics/visits | Done |
| Engagement Events | engagement_events | /api/metrics/event | Next |
| Funnel Steps | funnel_events | /api/metrics/funnel | Next |
| Geo Stats | visit_events (country) | same | Later |
| Performance Buckets | perf_events | /api/metrics/perf | Later |

---
Feel free to request expansion and we can scaffold the next layer.
