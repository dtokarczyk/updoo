'use client';

import { usePathname } from 'next/navigation';
import { SidebarLayout } from '@/app/components/SidebarLayout';
import { MySidebar } from './MySidebar';

export function MyLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar =
    pathname === '/my' || pathname.startsWith('/my/');

  return (
    <SidebarLayout
      sidebar={<MySidebar variant="sidebar" />}
      mobileList={<MySidebar variant="list" />}
      showSidebar={showSidebar}
    >
      {children}
    </SidebarLayout>
  );
}
