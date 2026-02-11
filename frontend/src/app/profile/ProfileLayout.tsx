import { headers } from 'next/headers';
import { SidebarLayout } from '@/app/components/SidebarLayout';
import { ProfileSidebar } from './ProfileSidebar';
import { X_PATHNAME_HEADER } from '@/middleware';

const PROFILE_EDIT_SEGMENTS = [
  '/profile/basic',
  '/profile/skills',
  '/profile/business-profile',
  '/profile/company',
  '/profile/password',
  '/profile/notifications',
];

export async function ProfileLayoutServer({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get(X_PATHNAME_HEADER) ?? '';
  const isMenuPage = pathname === '/profile' || pathname === '/profile/';
  const showSidebar =
    !isMenuPage && PROFILE_EDIT_SEGMENTS.some((seg) => pathname === seg);

  return (
    <SidebarLayout
      sidebar={<ProfileSidebar variant="sidebar" />}
      mobileList={<ProfileSidebar variant="list" />}
      showSidebar={showSidebar}
    >
      {children}
    </SidebarLayout>
  );
}
