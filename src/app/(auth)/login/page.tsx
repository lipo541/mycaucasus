"use client";
import Login from '../../../components/auth/Login';
import { AuthRedirectGuard } from '../../../components/auth/AuthRedirectGuard';

// Hard-force dynamic behavior; also disable any caching layers that could
// attempt static optimization. Making the page itself a client component
// fully sidesteps prerender execution of client-only auth logic.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function LoginPage() {
  return (
    <AuthRedirectGuard>
      <Login />
    </AuthRedirectGuard>
  );
}
