'use client';

import {
  User,
  Award,
  CreditCard,
  Building2,
  Key,
  Bell,
} from 'lucide-react';
import { SidebarNavList, type SidebarNavItem } from '@/components/SidebarNavList';

const PROFILE_NAV: SidebarNavItem[] = [
  { href: '/profile/basic', labelKey: 'profile.tabBasic', icon: User },
  { href: '/profile/skills', labelKey: 'profile.tabSkills', icon: Award },
  { href: '/profile/business-profile', labelKey: 'profile.menuBusinessProfile', icon: CreditCard },
  { href: '/profile/company', labelKey: 'profile.tabCompany', icon: Building2 },
  { href: '/profile/password', labelKey: 'profile.tabPassword', icon: Key },
  { href: '/profile/notifications', labelKey: 'notifications.tabNotifications', icon: Bell },
];

export function ProfileSidebar({
  variant = 'sidebar',
}: {
  variant?: 'sidebar' | 'list';
}) {
  return (
    <SidebarNavList
      items={PROFILE_NAV}
      ariaLabelKey="profile.editProfile"
      variant={variant}
    />
  );
}
