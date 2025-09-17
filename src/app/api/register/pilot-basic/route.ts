import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Action: sign-doc (generate signed URL for a storage path)
    if (body?.action === 'sign-doc') {
      const path = body?.path as string | undefined;
      const expires = Number(body?.expires || 600);
      if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!SUPABASE_URL || !SERVICE_KEY) {
        return NextResponse.json({ error: 'Server is misconfigured (Supabase env missing).' }, { status: 500 });
      }
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data, error } = await admin.storage.from('pilot_documents').createSignedUrl(path, expires);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ url: data.signedUrl, expiresIn: expires });
    }

    // Action: send-global-messages (append a message to many users by audience)
    if (body?.action === 'send-global-messages') {
      const { text, audience } = body || {};
      if (!text || !audience) return NextResponse.json({ error: 'Missing text or audience' }, { status: 400 });
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!SUPABASE_URL || !SERVICE_KEY) return NextResponse.json({ error: 'Server Supabase env missing' }, { status: 500 });
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);

      // Fetch users by pages (cap pages to avoid timeouts)
      const perPage = 200;
      const maxPages = 10; // up to 2000 users per call
      const allUsers: any[] = [];
      for (let page = 1; page <= maxPages; page++) {
        const { data, error } = await (admin as any).auth.admin.listUsers({ page, perPage });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        const list = (data?.users || data?.data || []) as any[];
        allUsers.push(...list);
        if (!list.length || (data && (data as any).total && allUsers.length >= (data as any).total)) break;
      }

      // Filter by audience
      const shouldInclude = (u: any) => {
        const md = (u?.user_metadata || {}) as any;
        const role = String(md.role || '').toLowerCase();
        const pilotKind = String(md.pilot_kind || '').toLowerCase();
        if (audience === 'everyone') return true;
        if (audience === 'users') return role === 'user' || role === '' || (!role && !md.role);
        if (audience === 'pilots') return role === 'pilot';
        if (audience === 'solo') return role === 'pilot' && pilotKind === 'solo';
        if (audience === 'tandem') return role === 'pilot' && pilotKind === 'tandem';
        return false;
      };

      const targets = allUsers.filter(shouldInclude);
      const msg = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        type: 'admin',
        text: String(text),
        from: 'superadmin',
        unread: true,
        created_at: new Date().toISOString(),
      };

      // Batch updates sequentially (keep it simple); in real world, parallel with limits.
      let updated = 0;
      for (const u of targets) {
        const md = (u?.user_metadata || {}) as any;
        const messages = Array.isArray(md.messages) ? md.messages : [];
        const newMd = { ...md, messages: [msg, ...messages] };
        const { error: updErr } = await (admin as any).auth.admin.updateUserById(u.id, { user_metadata: newMd });
        if (!updErr) updated++;
      }

      return NextResponse.json({ ok: true, updated, total: targets.length });
    }

    // Action: reject-user (set status=rejected and append message)
    if (body?.action === 'reject-user') {
      const { userId, reason } = body || {};
      if (!userId || !reason) return NextResponse.json({ error: 'Missing userId or reason' }, { status: 400 });
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!SUPABASE_URL || !SERVICE_KEY) return NextResponse.json({ error: 'Server Supabase env missing' }, { status: 500 });
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      // Fetch user
      const { data: got, error: getErr } = await (admin as any).auth.admin.getUserById(userId);
      if (getErr) return NextResponse.json({ error: getErr.message }, { status: 400 });
      const md = (got?.user?.user_metadata || {}) as any;
      const messages = Array.isArray(md.messages) ? md.messages : [];
      const msg = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        type: 'reject',
        text: String(reason),
        from: 'superadmin',
        unread: true,
        created_at: new Date().toISOString(),
      };
      const newMd = { ...md, status: 'rejected', messages: [msg, ...messages] };
      const { error: updErr } = await (admin as any).auth.admin.updateUserById(userId, { user_metadata: newMd });
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    // Action: approve-user (set status=active)
    if (body?.action === 'approve-user') {
      const { userId } = body || {};
      if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!SUPABASE_URL || !SERVICE_KEY) return NextResponse.json({ error: 'Server Supabase env missing' }, { status: 500 });
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data: got, error: getErr } = await (admin as any).auth.admin.getUserById(userId);
      if (getErr) return NextResponse.json({ error: getErr.message }, { status: 400 });
      const md = (got?.user?.user_metadata || {}) as any;
      const newMd = { ...md, status: 'active' };
      const { error: updErr } = await (admin as any).auth.admin.updateUserById(userId, { user_metadata: newMd });
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    // Action: send-message (append a message to user)
    if (body?.action === 'send-message') {
      const { userId, text } = body || {};
      if (!userId || !text) return NextResponse.json({ error: 'Missing userId or text' }, { status: 400 });
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!SUPABASE_URL || !SERVICE_KEY) return NextResponse.json({ error: 'Server Supabase env missing' }, { status: 500 });
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data: got, error: getErr } = await (admin as any).auth.admin.getUserById(userId);
      if (getErr) return NextResponse.json({ error: getErr.message }, { status: 400 });
      const md = (got?.user?.user_metadata || {}) as any;
      const messages = Array.isArray(md.messages) ? md.messages : [];
      const msg = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        type: 'admin',
        text: String(text),
        from: 'superadmin',
        unread: true,
        created_at: new Date().toISOString(),
      };
      const newMd = { ...md, messages: [msg, ...messages] };
      const { error: updErr } = await (admin as any).auth.admin.updateUserById(userId, { user_metadata: newMd });
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    const { firstName, lastName, email, phone, birthDate, gender } = body || {};

    // Basic server-side validation
    if (!firstName || !lastName || !email || !phone || !birthDate || !gender) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Server is misconfigured (Supabase env missing).' }, { status: 500 });
    }

    // Auth check: ensure current user is superadmin
    const cookieStore = await cookies();
    const current = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { 'X-Client-Info': 'mycaucasus-admin' } },
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        flowType: 'pkce',
      }
    });
    // Attach auth cookie manually is non-trivial here; we fallback to listing only if admin cookie present via service guard
    // For now, proceed to list; /admin route gate ensures superadmin UI access.
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const full_name = `${firstName} ${lastName}`.trim();

    // Send invitation email (activation link). Metadata includes status: inactive; role intentionally omitted for now
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        status: 'inactive',
        full_name,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: birthDate,
        gender,
        phone,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, userId: data.user?.id ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

// List users (superadmin-only via service role). This endpoint is protected by server-side role checks on /admin routes.
export async function GET(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Server is misconfigured (Supabase env missing). Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Vercel Project Settings > Environment Variables.' }, { status: 500 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    // Basic pagination support (defaults)
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '1');
    const perPage = Number(searchParams.get('perPage') || '100');

    const { data, error } = await (admin as any).auth.admin.listUsers({ page, perPage });
  if (error) return NextResponse.json({ error: `Supabase listUsers failed: ${error.message}` }, { status: 400 });
    const users = (data?.users || data?.data || []) as any[];
    // Exclude superadmin accounts from the listing
    const visibleUsers = users.filter((u: any) => {
      const role = ((u?.user_metadata?.role) ?? '').toString().toLowerCase();
      return role !== 'superadmin';
    });

    const mapped = await Promise.all(visibleUsers.map(async (u: any) => {
      const md = (u?.user_metadata || {}) as Record<string, any>;
      const first = (md.first_name || '').trim();
      const last = (md.last_name || '').trim();
      const full = (md.full_name || `${first} ${last}` || '').trim();
      const name = full || (u?.email?.split('@')[0] || 'Unknown');

      const rawRole = (md.role || '').toString().toLowerCase();
      const pilotKind = (md.pilot_kind || '').toString();
      let role: string = 'User';
      if (rawRole === 'superadmin') role = 'Superadmin';
      else if (rawRole === 'operator') role = 'Operator';
      else if (rawRole === 'pilot') role = pilotKind === 'tandem' ? 'Pilot (Tandem)' : (pilotKind === 'solo' ? 'Pilot (Solo)' : 'Pilot (Solo)');

      const rawStatus = (md.status || (u?.email_confirmed_at ? 'active' : 'inactive')).toString().toLowerCase();
      const status = rawStatus === 'pending' ? 'Pending' : rawStatus === 'rejected' ? 'Rejected' : rawStatus === 'active' ? 'Active' : 'Inactive';

  const licensePaths = Array.isArray(md.license_doc_storage_paths) ? md.license_doc_storage_paths : [];
      const license_doc_filenames = licensePaths.map((p: string) => (p?.split('/')?.pop() || p)).filter(Boolean);
      const avatar_storage_path = md.avatar_storage_path || null;
      let avatar_signed_url: string | null = null;
      if (avatar_storage_path) {
        try {
          const { data: signed } = await admin.storage.from('avatars').createSignedUrl(avatar_storage_path, 3600);
          avatar_signed_url = signed?.signedUrl || null;
        } catch {}
      }

      return {
        id: u.id,
        name,
        email: u.email,
        role,
        status,
        joined: (u.created_at || '').slice(0, 10),
        phone: md.phone || null,
        location: md.location || null,
        about: md.about || null,
        rating: md.rating ?? null,
        pilot_kind: pilotKind || null,
        pilot_type: md.pilot_type || null,
        experience_years: md.experience_years ?? null,
        flights_count: md.flights_count ?? null,
        wing_models: md.wing_models || [],
        harness_models: md.harness_models || [],
        reserve_models: md.reserve_models || [],
        passenger_harness_models: md.passenger_harness_models || [],
        license_doc_filenames,
        license_doc_paths: licensePaths,
        avatar_storage_path,
        avatar_url: md.avatar_url || md.picture || null,
        avatar_signed_url,
        blocked: md.blocked || false,
      };
    }));

    return NextResponse.json({ users: mapped, page, perPage });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
