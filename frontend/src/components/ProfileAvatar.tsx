'use client';

import { useAuth } from '@/contexts/AuthContext';
import type { AuthUser } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/** Get initials from user (name + surname, name, email, or "?"). */
export function getInitials(user: AuthUser | null): string {
  if (!user) return '?';
  const n = user.name?.trim();
  const s = user.surname?.trim();
  if (n && s) return (n[0] + s[0]).toUpperCase();
  if (n) return n.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return '?';
}

type ProfileAvatarProps = {
  className?: string;
};

/**
 * Avatar for the current logged-in user. Uses AuthContext for user data.
 * Shows avatar image when available, otherwise initials. When not logged in, shows "?".
 */
/** Append cache buster to avatar URL so browser refetches after upload/remove. */
function avatarUrlWithCacheBuster(url: string | null, userKey: number): string | undefined {
  if (!url) return undefined;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${userKey}`;
}

export function ProfileAvatar({ className }: ProfileAvatarProps) {
  const { user, userKey } = useAuth();
  const initials = getInitials(user);
  const avatarUrl = user?.avatarUrl ?? null;
  const avatarSrc = avatarUrlWithCacheBuster(avatarUrl, userKey);

  return (
    <Avatar
      className={cn('shrink-0', className)}
      aria-hidden
    >
      {avatarSrc ? (
        <AvatarImage src={avatarSrc} alt="" />
      ) : null}
      <AvatarFallback className="text-sm font-medium text-muted-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
