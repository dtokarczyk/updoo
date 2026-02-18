'use client';

import { FileText, LayoutDashboard, Mail, Users } from 'lucide-react';
import {
  SidebarNavList,
  type SidebarNavItem,
} from '@/components/SidebarNavList';

const ADMIN_NAV: SidebarNavItem[] = [
  { href: '/admin/main', labelKey: 'admin.tabDashboard', icon: LayoutDashboard },
  { href: '/admin/users', labelKey: 'admin.tabUsers', icon: Users },
  { href: '/admin/proposals', labelKey: 'admin.tabProposals', icon: FileText },
  { href: '/admin/mailer-log', labelKey: 'admin.tabMailerLog', icon: Mail },
];

export function AdminSidebar({
  variant = 'sidebar',
}: {
  variant?: 'sidebar' | 'list';
}) {
  return (
    <SidebarNavList
      items={ADMIN_NAV}
      ariaLabelKey="admin.sidebarLabel"
      variant={variant}
    />
  );
}
