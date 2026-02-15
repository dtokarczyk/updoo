'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Moon, Sun, Settings, ShieldCheck, LogOut } from 'lucide-react';
import { type AccountType, type AuthUser } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/hooks/useTranslations';
import { useTheme } from '@/lib/theme';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

/** Full display name: "Name Surname" or fallback to email / "Profil". */
function displayName(user: AuthUser, t: (key: string) => string): string {
  const n = user.name?.trim();
  const s = user.surname?.trim();
  if (n && s) return `${n} ${s}`;
  if (n) return n;
  if (s) return s;
  return user.email || t('profile.editProfile');
}

export interface UserDropdownProps {
  /** When true, trigger shows only the avatar (no name/role). */
  iconOnly?: boolean;
  /** When true, trigger stretches to full width (e.g. in sidebar). */
  fullWidth?: boolean;
  /** Preferred side for the dropdown (e.g. "top" for bottom nav). */
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function UserDropdown({
  iconOnly = false,
  fullWidth = false,
  side = 'bottom',
}: UserDropdownProps = {}) {
  const router = useRouter();
  const { t } = useTranslations();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    router.push('/');
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            iconOnly
              ? 'flex shrink-0 items-center justify-center rounded-full border border-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              : 'flex w-full shrink-0 items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 hover:bg-muted hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            fullWidth ? 'w-full border-border' : '',
          )}
          aria-label={t('nav.openAccountMenu')}
        >
          <ProfileAvatar className="h-8 w-8 shrink-0" />
          {!iconOnly && (
            <span
              className={cn(
                'min-w-0 flex-col items-start text-left',
                fullWidth ? 'flex' : 'hidden sm:flex',
              )}
            >
              <span className="truncate text-sm font-medium text-foreground leading-tight">
                {user ? displayName(user, t) : t('profile.editProfile')}
              </span>
              <span className="truncate text-xs text-muted-foreground leading-tight">
                {user ? accountTypeLabel(user.accountType, t) : ''}
              </span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={side} className="z-[100] min-w-40">
        <DropdownMenuLabel className="font-normal text-foreground pb-0">
          {user ? displayName(user, t) : t('profile.editProfile')}
        </DropdownMenuLabel>
        <DropdownMenuLabel className="font-normal text-muted-foreground text-xs pt-0.5 pb-1.5">
          {user ? accountTypeLabel(user.accountType, t) : ''}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <Settings className="h-4 w-4 shrink-0" aria-hidden />
            {t('nav.settings')}
          </Link>
        </DropdownMenuItem>
        {user?.accountType === 'ADMIN' && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
              Panel administracyjny
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={toggleTheme}
          className="flex items-center gap-2"
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Sun className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {theme === 'light' ? t('nav.themeDark') : t('nav.themeLight')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {t('common.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
