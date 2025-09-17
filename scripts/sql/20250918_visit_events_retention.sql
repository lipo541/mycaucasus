-- Visit events retention policy
-- Purge rows older than 180 days to limit storage & implicit personal data duration.
-- Uses pg_cron (Supabase provides it) to schedule a nightly job.
-- If pg_cron extension not enabled in your project, enable it first:
--   select * from pg_available_extensions where name='pg_cron';
--   create extension if not exists pg_cron with schema public;  -- (Supabase may already have it)

begin;

-- Safety: create a function that deletes in small batches to avoid long locks if table grows large.
create or replace function public.prune_visit_events(limit_batch integer default 5000)
returns integer
language plpgsql
as $$
DECLARE
  v_deleted integer := 0;
BEGIN
  loop
    delete from public.visit_events
    where ts < (now() - interval '180 days')
    and id in (
      select id from public.visit_events
      where ts < (now() - interval '180 days')
      order by id asc
      limit limit_batch
    );
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    exit when v_deleted = 0; -- nothing more to prune
    -- Optional: perform only one batch per invocation to keep cron job short
    exit; 
  end loop;
  return v_deleted;
END;
$$;

-- Schedule nightly at 02:17 UTC (arbitrary minute to avoid top-of-hour contention)
-- If a cron job with same name exists, drop first.
select cron.unschedule(jobid) from cron.job where jobname='prune_visit_events_job';
select cron.schedule('prune_visit_events_job', '17 2 * * *', $$select public.prune_visit_events();$$);

commit;
