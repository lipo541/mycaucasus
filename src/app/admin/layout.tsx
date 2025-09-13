"use client";
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// Guard removed per cleanup decision: layout now contains only role gating.

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
	const [role, setRole] = useState<string | null>(null);
	const router = useRouter();
	const supabase = createSupabaseBrowserClient();

	useEffect(() => {
		const fetchRole = async () => {
			const {
				data: { session }
			} = await supabase.auth.getSession();
			if (session) {
				const userRole = session.user.user_metadata.role;
				setRole(userRole);
				if (userRole !== 'superadmin') {
					router.push('/');
				}
			} else {
				router.push('/login');
			}
		};

		fetchRole();
	}, [supabase, router]);

	if (role !== 'superadmin') {
		return null;
	}
	return <div className="admin-shell">{children}</div>;
}
