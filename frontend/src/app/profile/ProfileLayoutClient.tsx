'use client';

import { usePathname } from 'next/navigation';
import { ProfileSidebar } from './ProfileSidebar';

const PROFILE_EDIT_SEGMENTS = [
  '/profile/basic',
  '/profile/skills',
  '/profile/visiting-card',
  '/profile/password',
];

export function ProfileLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMenuPage = pathname === '/profile' || pathname === '/profile/';
  const showSidebar =
    !isMenuPage && PROFILE_EDIT_SEGMENTS.some((seg) => pathname === seg);

  return (
    <div className="flex min-h-full w-full flex-col md:flex-row md:gap-6">
      {showSidebar && (
        <div className="hidden md:block">
          <ProfileSidebar />
        </div>
      )}
      <main className="flex min-w-0 flex-1 justify-center">
        {children}
      </main>
    </div>
  );
}
