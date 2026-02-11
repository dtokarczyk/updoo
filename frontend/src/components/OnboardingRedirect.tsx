'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  getStoredUser,
  getToken,
  getProfile,
  needsOnboarding,
} from '@/lib/api';

const SKIP_AGREEMENTS_PATHS = [
  '/agreements',
  '/login',
  '/register',
  '/onboarding',
];

function shouldSkipAgreementsCheck(pathname: string): boolean {
  return SKIP_AGREEMENTS_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

/**
 * Redirects when user is logged in but has not accepted current agreements
 * (→ /agreements/accept) or, only on "/", has not completed onboarding (→ /onboarding).
 */
export function OnboardingRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (shouldSkipAgreementsCheck(pathname)) return;
    const token = getToken();
    if (!token) return;
    const user = getStoredUser();
    if (!user) return;
    let cancelled = false;
    getProfile()
      .then((profile) => {
        if (cancelled || !profile) return;
        if (profile.needsAgreementsAcceptance) {
          router.replace('/agreements/accept');
          return;
        }
        if (pathname === '/' && needsOnboarding(profile.user)) {
          router.replace('/onboarding');
        }
      })
      .catch(() => {
        if (!cancelled) router.replace('/agreements/accept');
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return <>{children}</>;
}
