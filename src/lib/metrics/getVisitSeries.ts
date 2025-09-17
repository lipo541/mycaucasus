import { createClient } from '@supabase/supabase-js';
import { DEFAULT_VISIT_DAYS } from './constants';
import type { VisitSeries } from './types';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function getVisitSeries(days = DEFAULT_VISIT_DAYS): Promise<VisitSeries> {
  if (days < 1) days = 1; if (days > 120) days = 120;
  const admin = getAdminClient();

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));

  const fromStr = from.toISOString().slice(0,10);
  const toStr = to.toISOString().slice(0,10);

  let rows: { ymd: string; visits: number; unique?: number; unique_sessions?: number; }[] = [];
  try {
    const { data, error } = await admin.rpc('visit_series', { p_from: fromStr, p_to: toStr });
    if (!error && data) rows = data as any;
    else {
      // fallback direct aggregate if RPC not yet created
      const { data: direct, error: aggErr } = await admin
        .from('visit_events')
        .select('ymd, visits:count, unique:session_id', { count: 'exact', head: false }) as any; // will adjust after SQL function exists
      if (!aggErr && Array.isArray(direct)) rows = direct as any;
    }
  } catch (e) {
    // swallow; will produce empty series below
  }

  // Build map for O(1) lookup
  const map = new Map(rows.map(r => [r.ymd, r]));
  const points = [] as { date: string; visits: number; unique: number }[];
  let cursor = new Date(from);
  while (cursor <= to) {
    const d = cursor.toISOString().slice(0,10);
  const rec = map.get(d);
  const uniq = rec?.unique ?? rec?.unique_sessions ?? 0;
  points.push({ date: d, visits: rec?.visits || 0, unique: uniq });
    cursor.setDate(cursor.getDate() + 1);
  }
  const totals = points.reduce((a,p)=>{ a.visits+=p.visits; a.unique+=p.unique; return a; }, { visits:0, unique:0 });
  return { range: { from: fromStr, to: toStr, days }, points, totals };
}
