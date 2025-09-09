import type { Metadata } from 'next';
import 'flag-icons/css/flag-icons.min.css';
import '../globals.css';
import '../../components/ui/ui.css';
import '../../components/header/header.css';
import { Header } from '../../components/header/Header';

export const metadata: Metadata = {
  title: 'Paragliding Platform',
  description: 'Paragliding tourism, licensing & pilot community platform',
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
