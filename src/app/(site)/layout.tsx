import type { Metadata } from 'next';
import 'flag-icons/css/flag-icons.min.css';
import '../globals.css';
import { Header } from '@/components/header/Header';
import AdminRootWrapper from '@/components/AdminRootWrapper';

// Server layout: exports metadata. Client-only routing logic lives in AdminRootWrapper.
export const metadata: Metadata = {
  title: 'Paragliding Platform',
  description: 'Paragliding tourism, licensing & pilot community platform',
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <AdminRootWrapper>{children}</AdminRootWrapper>
    </>
  );
}
