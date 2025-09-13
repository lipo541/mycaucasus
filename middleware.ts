import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
	let response = NextResponse.next({
		request: {
			headers: request.headers
		}
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
				},
				setAll(cookiesToSet) {
					for (const { name, value, options } of cookiesToSet) {
						request.cookies.set({ name, value, ...options });
						response.cookies.set({ name, value, ...options });
					}
				},
			},
		}
	);

	const { data: { session } } = await supabase.auth.getSession();
	const userRole = session?.user?.user_metadata?.role;

	const path = request.nextUrl.pathname;

	// Strategy change: Superadmin is confined to /admin namespace.
	// 1. Non-superadmin trying to access /admin -> redirect to '/'
	// 2. Superadmin accessing ANY non-/admin route -> redirect to '/admin'

	if (path.startsWith('/admin')) {
		if (userRole !== 'superadmin') {
			return NextResponse.redirect(new URL('/', request.url));
		}
	} else {
		if (userRole === 'superadmin') {
			return NextResponse.redirect(new URL('/admin', request.url));
		}
	}

	// Block auth pages for any authenticated user (now also covered by superadmin confinement above)
	if (session && (path === '/login' || path === '/register' || path.startsWith('/register/'))) {
		return NextResponse.redirect(new URL(userRole === 'superadmin' ? '/admin' : '/', request.url));
	}

	return response;
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
