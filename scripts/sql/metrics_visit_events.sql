-- Visit events table
create table if not exists public.visit_events (
  id bigserial primary key,
  ts timestamptz not null default now(),
  ymd date generated always as (ts::date) stored,
  session_id text not null,
  path text not null,
  ref_domain text null,
  ip_hash text null,
  ua_hash text null,
  user_id uuid null,
  extra jsonb null
);

-- Performance indexes
create index if not exists idx_visit_events_ymd on public.visit_events(ymd);
create index if not exists idx_visit_events_session on public.visit_events(session_id);
create index if not exists idx_visit_events_ts on public.visit_events(ts desc);
create index if not exists idx_visit_events_path_ymd on public.visit_events(ymd, path);

-- (Optional) RLS policies (enable after testing)
-- alter table public.visit_events enable row level security;
-- create policy "allow inserts anon" on public.visit_events for insert to anon with check (true);
-- create policy "allow select admin only" on public.visit_events for select using (auth.role() = 'service_role');

-- Aggregation helper function (RPC) - returns daily counts between range
create or replace function public.visit_series(p_from date, p_to date)
returns table(ymd date, visits bigint, unique_sessions bigint)
language sql stable as $$
  select d::date as ymd,
         coalesce(count(v.id),0) as visits,
         coalesce(count(distinct v.session_id),0) as unique_sessions
    from generate_series(p_from, p_to, interval '1 day') d
    left join public.visit_events v on v.ymd = d
   group by d
   order by d;
$$;
