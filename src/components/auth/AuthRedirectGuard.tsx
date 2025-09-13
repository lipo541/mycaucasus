"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

/**
 * AuthRedirectGuard
 * Client-side UX guard to prevent authenticated users (especially superadmin)
 * from briefly seeing login / registration pages. Middleware already enforces
 * server redirects; this removes any flash during client navigation.
 */
export function AuthRedirectGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();
  const [ checking, setChecking ] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const role = data.session?.user?.user_metadata?.role;
      if (data.session) {
        if (role === 'superadmin') {
          router.replace('/admin');
          return;
        }
        // Other authenticated roles -> send to home (can adjust by role)
        router.replace('/');
        return;
      }
      setChecking(false);
    });
    return () => { alive = false; };
  }, [supabase, router, pathname]);

  if (checking) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'40vh',fontSize:'0.9rem',color:'#a1a1a1'}}>
        ავტორიზაციის შემოწმება...
      </div>
    );
  }

  return <>{children}</>;
}
