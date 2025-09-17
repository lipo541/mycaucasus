-- Enable Row Level Security for visit_events
-- This protects the raw analytics table from direct anon access.
-- The application writes via the Supabase service role key on the server,
-- which bypasses RLS automatically. No client-side (anon) inserts should occur.

begin;

-- 1. Enable RLS
alter table public.visit_events enable row level security;

-- 2. (Defensive) Revoke anon privileges (if previously granted)
revoke all on table public.visit_events from anon;
-- If the sequence name differs, adjust; default pattern is <table>_id_seq
-- (Skip errors if sequence doesn't exist in your setup.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind='S' AND c.relname='visit_events_id_seq' AND n.nspname='public'
  ) THEN
    EXECUTE 'revoke all on sequence public.visit_events_id_seq from anon;';
  END IF;
END $$;

-- 3. (Optional) A read policy placeholder. Not added now because only service role should access.
-- If in future you want authenticated admins to view aggregated data directly, you can add:
-- create policy "allow_admin_read_visit_events" on public.visit_events
--   for select using (
--     auth.role() = 'authenticated'
--     and exists (
--       select 1 from user_roles where user_id = auth.uid() and role = 'admin'
--     )
--   );
-- (You'd need a user_roles table or adapt to your auth metadata logic.)

-- 4. (Optional) Composite index to speed up per-day unique session scans.
-- create index if not exists idx_visit_events_ymd_session on public.visit_events (ymd, session_id);

commit;
