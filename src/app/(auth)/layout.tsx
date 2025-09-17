import type { Metadata } from 'next';
import 'flag-icons/css/flag-icons.min.css';
import '../globals.css';
import { Header } from '../../components/header/Header';
import './auth-layout.css';

// Ensure no static optimization is attempted for auth pages.
// (Login/registration rely on client-only Supabase session checks.)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Auth',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="auth-shell">
        <div className="auth-shell__inner">
          {children}
        </div>
      </div>
    </>
  );
}
