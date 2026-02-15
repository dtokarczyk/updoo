'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredUser, getProfilePendingCount } from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { FileText } from 'lucide-react';

/**
 * Shown on homepage above the feed when user is admin and there are profiles pending verification.
 * Uses shadcn/ui Alert with custom amber styling.
 */
export function AdminPendingProfilesBanner() {
  const { t } = useTranslations();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.accountType !== 'ADMIN') {
      setCount(0);
      return;
    }
    getProfilePendingCount()
      .then((res) => setCount(res.count))
      .catch(() => setCount(0));
  }, []);

  if (count == null || count === 0) return null;

  return (
    <Alert
      className="mb-4 border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400"
      role="alert"
    >
      <FileText className="size-4" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        {t('company.pendingProfilesBanner', { count: String(count) })}
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        <Link
          href="/profiles"
          className="font-medium underline hover:text-amber-800 dark:hover:text-amber-200"
        >
          {t('company.pendingProfilesLink')}
        </Link>
      </AlertDescription>
    </Alert>
  );
}
