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

  // Visit metrics (last 30 days + today) + deltas
  let todayVisits = 0;
  let yesterdayVisits = 0;
  let todayVsYesterdayPct: number | null = null;
  let avgDaily30 = 0; // current 30d window (including today)
  let prevAvgDaily30 = 0; // previous 30d window (days -60..-31)
  let avgDaily30Pct: number | null = null;
  let unique30 = 0; // unique sessions in current 30d window
  let prevUnique30 = 0; // unique sessions prior window
  let unique30Pct: number | null = null;
  try {
    const today = new Date();
    const todayStr = today.toISOString().slice(0,10);
    const from = new Date();
    from.setDate(from.getDate() - 29);
    const fromStr = from.toISOString().slice(0,10);
    // prior window (previous 30 days immediately before current window)
    const prevFrom = new Date(); prevFrom.setDate(prevFrom.getDate() - 59); // 60 days back inclusive
    const prevFromStr = prevFrom.toISOString().slice(0,10);
    const prevTo = new Date(); prevTo.setDate(prevTo.getDate() - 30); // day before current window starts
    const prevToStr = prevTo.toISOString().slice(0,10);
    // aggregate in one query: visits + uniques per day then reduce
    const [{ data, error }, { data: prevData, error: prevError }] = await Promise.all([
      admin
      .from('visit_events')
      .select('ymd, session_id', { head: false })
      .gte('ymd', fromStr)
      .lte('ymd', todayStr),
      admin
        .from('visit_events')
        .select('ymd, session_id', { head: false })
        .gte('ymd', prevFromStr)
        .lte('ymd', prevToStr)
    ]);
    if (!error && Array.isArray(data)) {
      const dayMap: Record<string,{ visits:number; sessions:Set<string> }> = {};
      for (const row of data as any[]) {
        const d = row.ymd as string; const sid = row.session_id as string;
        if (!dayMap[d]) dayMap[d] = { visits:0, sessions: new Set() };
        dayMap[d].visits++;
        if (sid) dayMap[d].sessions.add(sid);
      }
      const days = Object.keys(dayMap);
      let totalVisits30 = 0; let totalUnique30 = 0;
      for (const d of days) { totalVisits30 += dayMap[d].visits; totalUnique30 += dayMap[d].sessions.size; }
      todayVisits = dayMap[todayStr]?.visits || 0;
      // yesterday
      const y = new Date(); y.setDate(y.getDate() - 1); const yesterdayStr = y.toISOString().slice(0,10);
      yesterdayVisits = dayMap[yesterdayStr]?.visits || 0;
      if (yesterdayVisits > 0) {
        todayVsYesterdayPct = Math.round(((todayVisits - yesterdayVisits) / yesterdayVisits) * 10000) / 100;
      } else if (todayVisits > 0) {
        todayVsYesterdayPct = 100; // from 0 to >0 treat as +100%
      } else {
        todayVsYesterdayPct = 0;
      }
      avgDaily30 = days.length ? Math.round((totalVisits30 / 30) * 100) / 100 : 0;
      unique30 = totalUnique30;
    }
    if (!prevError && Array.isArray(prevData)) {
      const prevDayMap: Record<string,{ visits:number; sessions:Set<string> }> = {};
      for (const row of prevData as any[]) {
        const d = row.ymd as string; const sid = row.session_id as string;
        if (!prevDayMap[d]) prevDayMap[d] = { visits:0, sessions: new Set() };
        prevDayMap[d].visits++;
        if (sid) prevDayMap[d].sessions.add(sid);
      }
      const prevDays = Object.keys(prevDayMap);
      let prevVisitsTotal = 0; let prevUniqueTotal = 0;
      for (const d of prevDays) { prevVisitsTotal += prevDayMap[d].visits; prevUniqueTotal += prevDayMap[d].sessions.size; }
      prevAvgDaily30 = prevDays.length ? Math.round((prevVisitsTotal / 30) * 100) / 100 : 0;
      prevUnique30 = prevUniqueTotal;
      if (prevAvgDaily30 > 0) {
        avgDaily30Pct = Math.round(((avgDaily30 - prevAvgDaily30) / prevAvgDaily30) * 10000) / 100;
      } else if (avgDaily30 > 0) {
        avgDaily30Pct = 100;
      } else { avgDaily30Pct = 0; }
      if (prevUnique30 > 0) {
        unique30Pct = Math.round(((unique30 - prevUnique30) / prevUnique30) * 10000) / 100;
      } else if (unique30 > 0) {
        unique30Pct = 100;
      } else { unique30Pct = 0; }
    }
  } catch (e:any) {
    console.warn('[stats] visit metrics failed', e.message);
  }

  return {
    totalUsers,
    tandemPilots,
    soloPilots,
    pendingUsers,
    pendingContent,
    activeSessions,
    totalLocations,
    totalNews,
    todayVisits,
    yesterdayVisits,
    todayVsYesterdayPct,
    avgDaily30,
    prevAvgDaily30,
    avgDaily30Pct,
    unique30,
    prevUnique30,
    unique30Pct
  };
}

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;
