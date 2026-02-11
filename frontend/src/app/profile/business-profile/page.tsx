'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getMyProfiles,
  getLocations,
  type Profile,
  type Location,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import { BusinessProfileCompanyForm } from './BusinessProfileCompanyForm';

export default function ProfileBusinessProfilePage() {
  const { t } = useTranslations();
  const [contractorProfiles, setContractorProfiles] = useState<
    Profile[] | null
  >(null);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!contractorProfiles?.length) return;
    getLocations()
      .then(setLocations)
      .catch(() => {});
  }, [contractorProfiles?.length]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('profile.menuBusinessProfile')}</CardTitle>
        <CardDescription>{t('profile.businessProfileDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {contractorProfiles === null && (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        )}

        {contractorProfiles?.length === 0 && (
          <div className="space-y-2">
            <Alert>
              <AlertDescription>
                {t('profile.contractorProfileNone')}
              </AlertDescription>
            </Alert>
            <Button asChild variant="default">
              <Link href="/profile/create">
                {t('profile.contractorProfileCreate')}
              </Link>
            </Button>
          </div>
        )}

        {contractorProfiles &&
          contractorProfiles.length > 0 &&
          contractorProfiles.map((profile) => (
            <BusinessProfileCompanyForm
              key={profile.id}
              profile={profile}
              locations={locations}
              t={t}
              onProfileUpdated={(updated) => {
                setContractorProfiles((prev) =>
                  prev
                    ? prev.map((p) => (p.id === updated.id ? updated : p))
                    : prev,
                );
              }}
            />
          ))}
      </CardContent>
    </Card>
  );
}
