import { NextRequest, NextResponse } from 'next/server';
import { getVisitSeries } from '@/lib/metrics/getVisitSeries';

export const revalidate = 0;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const daysParam = url.searchParams.get('days');
  let days = Number(daysParam) || 30;
  try {
    const series = await getVisitSeries(days);
    return NextResponse.json({ ok: true, ...series });
  } catch (e) {
    console.error('[api/admin/metrics/visits] error', (e as Error).message);
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 });
  }
}
