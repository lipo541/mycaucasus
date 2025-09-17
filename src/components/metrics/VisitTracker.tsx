"use client";
import { useEffect } from 'react';
import { trackVisit } from '@/lib/metrics/trackVisit';

interface Props { enabled?: boolean; }

export function VisitTracker({ enabled = true }: Props) {
  useEffect(() => {
    if (!enabled) return;
    const path = window.location.pathname;
    const ref = document.referrer || undefined;
    trackVisit({ path, ref });
  }, [enabled]);
  return null;
}
export default VisitTracker;
