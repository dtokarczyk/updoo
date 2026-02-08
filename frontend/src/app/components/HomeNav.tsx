'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type AuthUser, type AccountType } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/hooks/useTranslations';

function accountTypeLabel(
  type: AccountType | null,
  t: (key: string) => string,
): string {
  if (!type) return '';
  const labels: Record<AccountType, string> = {
    CLIENT: t('accountTypes.client'),
    FREELANCER: t('accountTypes.freelancer'),
    ADMIN: t('accountTypes.admin'),
  };
  return labels[type];
}

export function initials(user: AuthUser): string {
  const n = user.name?.trim();
  const s = user.surname?.trim();
  if (n && s) return (n[0] + s[0]).toUpperCase();
  if (n) return n.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return '?';
}

/** Full display name: "Name Surname" or fallback to email / "Profil". */
export function displayName(
  user: AuthUser,
  t: (key: string) => string,
): string {
  const n = user.name?.trim();
  const s = user.surname?.trim();
  if (n && s) return `${n} ${s}`;
  if (n) return n;
  if (s) return s;
  return user.email || t('profile.editProfile');
}

export function UserDropdown(props: {
  user: AuthUser | null;
  dropdownOpen: boolean;
  setDropdownOpen: (v: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  handleLogout: () => void;
  openUp?: boolean;
  locale: string;
  t: (key: string) => string;
  iconOnly?: boolean;
  fullWidth?: boolean;
}) {
  const {
    user,
    dropdownOpen,
    setDropdownOpen,
    dropdownRef,
    handleLogout,
    openUp,
    t,
    iconOnly,
    fullWidth,
  } = props;
  return (
    <div className={cn('relative', fullWidth && 'w-full')} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={cn(
          iconOnly
            ? 'flex shrink-0 items-center justify-center rounded-full border border-transparent p-0'
            : 'flex w-full shrink-0 items-center gap-2 rounded-lg px-2 py-1.5',
          fullWidth
            ? 'border border-border hover:bg-muted hover:border-border'
            : 'border border-transparent hover:bg-muted hover:border-border',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground',
            iconOnly ? 'h-8 w-8' : 'h-8 w-8',
          )}
          aria-hidden
        >
          {user ? initials(user) : '?'}
        </span>
        {!iconOnly && (
          <span className="hidden min-w-0 flex-col items-start text-left sm:flex">
            <span className="truncate text-sm font-medium text-foreground leading-tight">
              {user ? displayName(user, t) : t('profile.editProfile')}
            </span>
            <span className="truncate text-xs text-muted-foreground leading-tight">
              {user ? accountTypeLabel(user.accountType, t) : ''}
            </span>
          </span>
        )}
      </button>
      {dropdownOpen && (
        <div
          className={cn(
            'absolute z-50 min-w-40 rounded-lg border border-border bg-card py-1 shadow-lg',
            openUp ? 'bottom-full left-0 mb-1' : 'right-0 top-full mt-1',
          )}
          role="menu"
        >
          <Link
            href="/profile/edit"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            onClick={() => setDropdownOpen(false)}
          >
            {t('profile.editProfile')}
          </Link>
          <Link
            href="/favorites"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            onClick={() => setDropdownOpen(false)}
          >
            {t('jobs.favorites')}
          </Link>
          {user?.accountType === 'ADMIN' && (
            <Link
              href="/admin"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
              onClick={() => setDropdownOpen(false)}
            >
              Panel administracyjny
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
          >
            {t('common.logout')}
          </button>
        </div>
      )}
    </div>
  );
}

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
  const router = useRouter();
  const { t, locale } = useTranslations();
  const { user, isLoggedIn, logout } = useAuth();
  const canCreateListing = isLoggedIn && user?.accountType === 'CLIENT';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    router.push('/');
    router.refresh();
  };

  if (placement === 'sidebar') {
    if (!isLoggedIn) return null;
    return (
      <UserDropdown
        user={user}
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
        dropdownRef={dropdownRef}
        handleLogout={handleLogout}
        locale={locale}
        t={t}
        fullWidth
      />
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
    // Don't show login/register buttons in header - they're in AuthBottomBar on mobile
    return null;
  }

  // Header: user dropdown is now handled separately in AppHeader (icon only)
  // Don't show dropdown here to avoid duplication
  return null;
}
