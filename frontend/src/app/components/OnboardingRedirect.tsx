'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredUser, getToken, needsOnboarding } from '@/lib/api';

/**
 * Redirects to /onboarding when user is logged in but has not completed
 * onboarding (missing name or account type). Only runs on pathname "/".
 */
export function OnboardingRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') return;
    const token = getToken();
    if (!token) return;
    const user = getStoredUser();
    if (needsOnboarding(user)) {
      router.replace('/onboarding');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
