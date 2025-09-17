import { createClient } from '@supabase/supabase-js';

/**
 * getAdminStats
 * Derives dashboard counters using Supabase service role.
 * Users & pilot kinds live in auth.users.user_metadata (role, pilot_kind, status)
 */
export async function getAdminStats() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase server env vars missing');
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  // --- Gather all users (paginate like pilot-basic route does) ---
  const perPage = 200;
  const maxPages = 10; // up to 2000 users
  const allUsers: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await (admin as any).auth.admin.listUsers({ page, perPage });
    if (error) { console.warn('[stats] listUsers error', error.message); break; }
    const list = (data?.users || data?.data || []) as any[];
    allUsers.push(...list);
    if (!list.length || (data && (data as any).total && allUsers.length >= (data as any).total)) break;
  }

  // Derive counts from metadata
  let totalUsers = 0;
  let tandemPilots = 0;
  let soloPilots = 0;
  let pendingUsers = 0;

  for (const u of allUsers) {
    const md = (u?.user_metadata || {}) as Record<string, any>;
    const role = String(md.role || '').toLowerCase();
    const pilotKind = String(md.pilot_kind || '').toLowerCase();
    const status = String(md.status || (u?.email_confirmed_at ? 'active' : 'inactive')).toLowerCase();

    // Count everyone except superadmins (dashboard stat usually excludes internal superadmins)
    if (role !== 'superadmin') totalUsers++;

    if (role === 'pilot') {
      if (pilotKind === 'tandem') tandemPilots++; else soloPilots++; // default to solo if unspecified
    }

    if (status === 'pending') pendingUsers++;
  }

  // Domain tables (placeholders if not yet created). Wrap each in try/catch.
  async function safeCount(table: string, filter?: (q: any) => any): Promise<number> {
    try {
      let q = admin.from(table).select('*', { count: 'exact', head: true });
      if (filter) q = filter(q);
      const { count, error } = await q;
      if (error) { console.warn(`[stats] ${table} count error`, error.message); return 0; }
      return count || 0;
    } catch (e: any) {
      console.warn(`[stats] ${table} count exception`, e.message);
      return 0;
    }
  }

  const [pendingContent, totalLocations, totalNews] = await Promise.all([
    safeCount('content', q => q.eq('status', 'pending')), // adjust if table/column differs
    safeCount('locations'),
    safeCount('news')
  ]);

  // Active sessions: heuristic based on hypothetical 'sessions' table
  let activeSessions = 0;
  try {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count, error } = await admin
      .from('sessions') // adjust if different
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', fifteenMinAgo);
    if (!error && count) activeSessions = count;
  } catch (e: any) {
    console.warn('[stats] sessions heuristic failed', e.message);
  }

  return {
    totalUsers,
    tandemPilots,
    soloPilots,
    pendingUsers,
    pendingContent,
    activeSessions,
    totalLocations,
    totalNews
  };
}

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;
