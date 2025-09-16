import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
