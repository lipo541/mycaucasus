import type { Metadata } from 'next';
import 'flag-icons/css/flag-icons.min.css';
import '../globals.css';
import { Header } from '../../components/header/Header';
import './auth-layout.css';

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
