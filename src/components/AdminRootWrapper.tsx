"use client";
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// Wraps children and conditionally applies the admin-root container.
export default function AdminRootWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) {
    return <div className="admin-root">{children}</div>;
  }
  return <>{children}</>;
}
