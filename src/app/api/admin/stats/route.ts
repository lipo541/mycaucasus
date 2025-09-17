import { NextResponse } from 'next/server';
import { getAdminStats } from '@/lib/stats/getAdminStats';

export const revalidate = 0; // always fresh

export async function GET() {
	try {
		const stats = await getAdminStats();
		return NextResponse.json({ ok: true, stats });
	} catch (e) {
		console.error('[api/admin/stats] error', (e as Error).message);
		return NextResponse.json({ ok: false, error: 'Failed to load stats' }, { status: 500 });
	}
}
