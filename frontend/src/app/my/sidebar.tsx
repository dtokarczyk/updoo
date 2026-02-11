'use client';

import { FileText, Heart } from 'lucide-react';
import { SidebarNavList, type SidebarNavItem } from '@/components/SidebarNavList';

const MY_NAV: SidebarNavItem[] = [
  { href: '/my/applications', labelKey: 'my.recentApplications', icon: FileText },
  { href: '/my/favorites', labelKey: 'my.favorites', icon: Heart },
];

export function Sidebar({
  variant = 'sidebar',
}: {
  variant?: 'sidebar' | 'list';
}) {
  return (
    <SidebarNavList
      items={MY_NAV}
      ariaLabelKey="my.title"
      variant={variant}
    />
  );
}
