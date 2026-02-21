'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/ui/button';
import { UserDropdown } from '@/components/UserDropdown';

interface HomeNavProps {
  /** When true, only show "Nowe ogłoszenie" link (for section header) */
  showCreateOnly?: boolean;
  /** When "sidebar", only show user dropdown (desktop only); use at bottom of sidebar */
  placement?: 'header' | 'sidebar';
}

export function HomeNav({
  showCreateOnly,
  placement = 'header',
}: HomeNavProps) {
  const { t } = useTranslations();
  const { user, isLoggedIn } = useAuth();
  const canCreateListing = isLoggedIn && user?.accountType === 'CLIENT';

  if (placement === 'sidebar') {
    if (!isLoggedIn) return null;
    return (
      <div className="w-full">
        <UserDropdown fullWidth />
      </div>
    );
  }

  if (showCreateOnly) {
    if (!canCreateListing) return null;
    return (
      <Link href="/job/new">
        <Button variant="outline" size="sm">
          {t('jobs.newJob')}
        </Button>
      </Link>
    );
  }

  if (!isLoggedIn) {
    // Don't show login/register in HomeNav - login is in AppHeader
    return null;
  }

  // Header: user dropdown is now handled separately in AppHeader (icon only)
  // Don't show dropdown here to avoid duplication
  return null;
}
