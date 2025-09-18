import Login from '../../../components/auth/Login';
import { AuthRedirectGuard } from '../../../components/auth/AuthRedirectGuard';

// Force dynamic rendering (auth state, Supabase session) while keeping the
// page itself a server component so Next accepts the route-level directives.
export const dynamic = 'force-dynamic';
export const revalidate = 0; // no ISR
export const fetchCache = 'force-no-store'; // disable fetch caching

export default function LoginPage() {
  return (
    <AuthRedirectGuard>
      <Login />
    </AuthRedirectGuard>
  );
}
