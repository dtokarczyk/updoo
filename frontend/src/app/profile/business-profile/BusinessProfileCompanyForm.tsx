'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, CircleAlert, Info } from 'lucide-react';
import { CardFooter } from '@/components/ui/card';
import { ContractorProfileFormFields } from '@/components/contractor-profile-form-fields';
import { CoverPhotoUpload } from '@/components/CoverPhotoUpload';
import {
  getContractorProfile,
  updateContractorProfile,
  type Profile,
  type Location,
} from '@/lib/api';
import {
  getBusinessProfileFormSchema,
  defaultBusinessProfileFormValues,
  type BusinessProfileFormValues,
} from './schema';

interface BusinessProfileCompanyFormProps {
  profile: Profile;
  locations: Location[];
  t: (key: string) => string;
  onProfileUpdated: (updated: Profile) => void;
}

export function BusinessProfileCompanyForm({
  profile,
  locations,
  t,
  onProfileUpdated,
}: BusinessProfileCompanyFormProps) {
  const router = useRouter();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [coverCacheBuster, setCoverCacheBuster] = useState<number | null>(null);

  const form = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(
      getBusinessProfileFormSchema(t),
    ) as Resolver<BusinessProfileFormValues>,
    defaultValues: defaultBusinessProfileFormValues,
    mode: 'onSubmit',
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => setLoadError(null));
    getContractorProfile(profile.id)
      .then((data) => {
        if (!cancelled) {
          reset({
            name: data.name ?? '',
            email: data.email ?? '',
            website: data.website ?? '',
            phone: data.phone ?? '',
            locationId: data.locationId ?? '',
            aboutUs: data.aboutUs ?? '',
          });
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(t('company.loadFailed'));
      });
    return () => {
      cancelled = true;
    };
  }, [profile.id, reset, t]);

  async function onSubmit(data: BusinessProfileFormValues) {
    setSubmitError('');
    setSuccess(false);
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        website: data.website?.trim() || undefined,
        locationId: data.locationId?.trim() || undefined,
        aboutUs: data.aboutUs?.trim() || undefined,
      };
      const updated = await updateContractorProfile(profile.id, payload);
      onProfileUpdated(updated);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('profile.saveFailed'),
      );
    }
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {!profile.isVerified && (
        <Alert>
          <Info />
          <AlertDescription>{t('company.statusPending')}</AlertDescription>
        </Alert>
      )}
      {submitError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertDescription>{t('profile.profileSaved')}</AlertDescription>
        </Alert>
      )}
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <CoverPhotoUpload
            profileId={profile.id}
            coverPhotoUrl={profile.coverPhotoUrl ?? null}
            onCoverUpdated={(updated) => {
              onProfileUpdated(updated);
              setCoverCacheBuster(Date.now());
              router.refresh();
            }}
            disabled={isSubmitting}
            t={t}
            coverCacheBuster={coverCacheBuster}
          />
          <ContractorProfileFormFields
            variant="standalone"
            locations={locations}
            disabled={isSubmitting}
            t={t}
          />
          <CardFooter className="flex flex-col gap-2 px-0">
            <Button asChild variant="outline" className="w-full">
              <Link
                href={`/company/${profile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('profile.viewMyProfile')}
              </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </div>
  );
}
