'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getToken, getMyProfiles, type Profile } from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';

export default function ProfileVisitingCardPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [contractorProfiles, setContractorProfiles] = useState<Profile[] | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) {
      router.replace('/login');
      return;
    }
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted || !getToken()) return;
    let cancelled = false;
    getMyProfiles()
      .then((list) => {
        if (!cancelled) setContractorProfiles(list);
      })
      .catch(() => {
        if (!cancelled) setContractorProfiles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('profile.menuVisitingCard')}</CardTitle>
        <CardDescription>{t('profile.contractorProfileDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {contractorProfiles === null && (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        )}
        {contractorProfiles?.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t('profile.contractorProfileNone')}
            </p>
            <Button asChild variant="default">
              <Link href="/profile/create">{t('profile.contractorProfileCreate')}</Link>
            </Button>
          </div>
        )}
        {contractorProfiles && contractorProfiles.length > 0 && (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <span className="font-medium">{contractorProfiles[0].name}</span>
              {contractorProfiles[0].slug && (
                <span className="ml-2 text-sm text-muted-foreground">
                  /company/{contractorProfiles[0].slug}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/company/${contractorProfiles[0].slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('common.view')}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/profile/company/${contractorProfiles[0].id}/edit`}>
                  {t('common.edit')}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
