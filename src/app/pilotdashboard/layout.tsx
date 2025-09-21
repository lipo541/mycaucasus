"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { PilotProvider } from '@/components/Pilotdashboard/PilotContext';

// Client-side guard at pilotdashboard root (mirrors admin layout)
export default function PilotDashboardRootLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [pilotKind, setPilotKind] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const md = (session.user as any)?.user_metadata || {};
      const r = md.role;
      const kind = (md.pilot_kind || '').toString().toLowerCase();
      setRole(r);
      setPilotKind(kind);
      const isPilot = r === 'pilot' && (kind === 'solo' || kind === 'tandem');
      if (!isPilot) {
        router.push('/');
      }
    };
    check();
  }, [supabase, router]);

  const isAllowed = role === 'pilot' && (pilotKind === 'solo' || pilotKind === 'tandem');
  if (!isAllowed) return null;
  return (
    <div className="admin-shell">
      <PilotProvider value={{
        role: role ?? null,
        pilotKind: pilotKind ?? null,
        isPilot: isAllowed,
        isSolo: pilotKind === 'solo',
        isTandem: pilotKind === 'tandem',
      }}>
        {children}
      </PilotProvider>
    </div>
  );
}
