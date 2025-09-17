import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
  const { path, ref, ts, session_id: bodySession } = await req.json();
    if (typeof path !== 'string' || !path.startsWith('/')) {
      return NextResponse.json({ ok: false, error: 'invalid path' }, { status: 400 });
    }
    const now = new Date();
    const eventTs = ts && Number.isFinite(ts) ? new Date(ts) : now;

  // Session id from header or body
  const headerSession = req.headers.get('x-session-id') || undefined;
  const sessionId = (headerSession || bodySession || 'pending').toString().slice(0,64);

    // Basic sanitized referrer domain
    let refDomain: string | null = null;
    try {
      if (ref) {
        const u = new URL(ref);
        refDomain = u.hostname;
      }
    } catch {}

    // Minimal hashing for IP & UA (privacy-conscious); can add SALT env later
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const ua = req.headers.get('user-agent') || '';
    let ipHash: string | null = null;
    let uaHash: string | null = null;
    const salt = process.env.METRICS_HASH_SALT || '';
    if (ip) {
      const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ip));
      ipHash = Buffer.from(data).toString('hex').slice(0, 32);
    }
    if (ua) {
      const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ua));
      uaHash = Buffer.from(data).toString('hex').slice(0, 32);
    }

    const admin = getAdmin();
    const { error } = await admin.from('visit_events').insert({
      ts: eventTs.toISOString(),
      path,
      ref_domain: refDomain,
      ip_hash: ipHash,
      ua_hash: uaHash,
      session_id: sessionId,
    });
    if (error) {
      console.warn('[metrics] insert error', error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
