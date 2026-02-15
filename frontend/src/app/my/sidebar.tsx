'use client';

import { FileText, Heart, Briefcase } from 'lucide-react';
import {
  SidebarNavList,
  type SidebarNavItem,
} from '@/components/SidebarNavList';
import { useAuth } from '@/contexts/AuthContext';

const FAVORITES_ITEM: SidebarNavItem = {
  href: '/my/favorites',
  labelKey: 'my.favorites',
  icon: Heart,
};

export function Sidebar({
  variant = 'sidebar',
}: {
  variant?: 'sidebar' | 'list';
}) {
  const { user } = useAuth();
  const isClient = user?.accountType === 'CLIENT';

  const items: SidebarNavItem[] = isClient
    ? [
        { href: '/my/jobs', labelKey: 'my.myListings', icon: Briefcase },
        FAVORITES_ITEM,
      ]
    : [
        {
          href: '/my/applications',
          labelKey: 'my.myApplications',
          icon: FileText,
        },
        FAVORITES_ITEM,
      ];

  return (
    <SidebarNavList items={items} ariaLabelKey="my.title" variant={variant} />
  );
}
