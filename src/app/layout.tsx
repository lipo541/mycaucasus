import './globals.css';
import '../components/ui/toaster.css';
import dynamic from 'next/dynamic';

const Toaster = dynamic(() => import('../components/ui/Toaster'), { ssr: false });
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
