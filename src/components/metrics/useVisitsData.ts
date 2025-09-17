"use client";
import { useEffect, useState } from 'react';
import type { VisitSeries } from '@/lib/metrics/types';

interface Options { days?: number; refreshMs?: number; }

export function useVisitsData({ days = 30, refreshMs = 60_000 }: Options = {}) {
  const [data, setData] = useState<VisitSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/metrics/visits?days=${days}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.ok) throw new Error('Failed');
      setData({ range: json.range, points: json.points, totals: json.totals });
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [days]);
  useEffect(() => {
    if (!refreshMs) return;
    const id = setInterval(load, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, days]);

  return { data, loading, error, reload: load };
}
