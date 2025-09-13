import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Returns the role stored in user.user_metadata.role or null.
// Safe: uses getUser() which validates the auth token with Supabase.
export async function getServerRole(): Promise<string | null> {
	// Await the cookies() call (Next 15 / React 19 async dynamic APIs).
	const cookieStore = await cookies();

	// Modern cookie adapter: implement getAll + setAll (even if read-only for this helper) to silence deprecation warnings.
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll().map(c => ({ name: c.name, value: c.value }));
				},
				setAll(cookiesToSet) {
					// getServerRole currently does not mutate cookies, but implement to follow API contract
					for (const { name, value, options } of cookiesToSet) {
						try { cookieStore.set(name, value, options); } catch { /* ignore readonly in edge runtime */ }
					}
				},
			},
		}
	);

	try {
		const { data, error } = await supabase.auth.getUser();
		if (error) {
			console.warn('getServerRole getUser error:', error.message);
			return null;
		}
		const user = data.user;
		if (!user) return null;
		return (user as any).user_metadata?.role ?? null;
	} catch (e) {
		console.error('Error in getServerRole:', e);
		return null;
	}
}
