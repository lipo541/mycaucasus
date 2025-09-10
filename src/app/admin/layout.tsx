'use client';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

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
	return <div className="admin-root">{children}</div>;
}
