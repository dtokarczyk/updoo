'use client';

import { useAuthQuery } from '@/lib/api-query';
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
 * Avatar for the current logged-in user. Uses React Query auth profile – updates
 * automatically after profile/avatar mutations (refetch). Key on image forces
 * remount when URL or userKey changes so the browser loads the new image.
 */
export function ProfileAvatar({ className }: ProfileAvatarProps) {
  const { user, userKey } = useAuthQuery();
  const initials = getInitials(user);
  const avatarUrl = user?.avatarUrl ?? null;

  console.log(avatarUrl);

  return (
    <Avatar
      className={cn('shrink-0', className)}
      aria-hidden
    >
      {avatarUrl ? (
        <AvatarImage
          key={`${avatarUrl}-${userKey}`}
          src={avatarUrl}
          alt=""
        />
      ) : <AvatarFallback className="text-sm font-medium text-muted-foreground">
        {initials}
      </AvatarFallback>}

    </Avatar>
  );
}
