'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  getStoredUser,
  getLocations,
  getMyProfiles,
  createContractorProfile,
  type Location,
  type Profile,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ContractorProfileFormFields } from '@/components/contractor-profile-form-fields';
import { CoverPhotoUpload } from '@/components/CoverPhotoUpload';
import { useTranslations } from '@/hooks/useTranslations';
import {
  profileFormSchema,
  defaultProfileFormValues,
  type ProfileFormValues,
} from './schemas';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CreateProfilePage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** After profile is created, we show cover upload step before redirect */
  const [createdProfile, setCreatedProfile] = useState<Profile | null>(null);
  const [coverCacheBuster, setCoverCacheBuster] = useState<number | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaultProfileFormValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    getLocations()
      .then(setLocations)
      .catch(() => setLocations([]));
    getMyProfiles()
      .then((profiles) => {
        if (profiles.length > 0) router.replace('/profile');
      })
      .catch(() => {});
  }, [router]);

  const onSubmit = async (data: ProfileFormValues) => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || undefined,
        website: data.website?.trim() || undefined,
        locationId: data.locationId?.trim() || undefined,
        aboutUs: data.aboutUs?.trim() || undefined,
      };
      const profile = await createContractorProfile(payload);
      setCreatedProfile(profile);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Nie udało się utworzyć profilu',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onFinish = () => {
    router.push('/');
    router.refresh();
  };

  // Step 2: after profile created – show cover photo (like in edit) then "Zakończ"
  if (createdProfile) {
    return (
      <main className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              {t('profile.create.createPageDone')}
            </CardTitle>
            <CardDescription>
              {t('profile.create.createPageAddCover')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CoverPhotoUpload
              profileId={createdProfile.id}
              coverPhotoUrl={createdProfile.coverPhotoUrl ?? null}
              onCoverUpdated={(updated) => {
                setCreatedProfile(updated);
                setCoverCacheBuster(Date.now());
                router.refresh();
              }}
              disabled={false}
              t={t}
              coverCacheBuster={coverCacheBuster}
            />
            <Button onClick={onFinish} className="w-full">
              {t('profile.create.createPageFinish')}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const advantages = [
    t('profile.create.createPageAdvantage1'),
    t('profile.create.createPageAdvantage2'),
    t('profile.create.createPageAdvantage3'),
    t('profile.create.createPageAdvantage4'),
    t('profile.create.createPageAdvantage5'),
  ];

  return (
    <main className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.create.createPageTitle')}</CardTitle>
          <CardDescription className="space-y-3">
            <span className="block">
              {t('profile.create.createPageDescription')}
            </span>
            <span className="block font-medium text-foreground mt-2">
              {t('profile.create.createPageAdvantagesTitle')}
            </span>
            <ul className="space-y-2">
              {advantages.map((text, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Circle
                    className={cn(
                      'size-2.5 mt-1.5 shrink-0 fill-primary text-primary',
                    )}
                    aria-hidden
                  />
                  <span className="text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <ContractorProfileFormFields
                variant="standalone"
                locations={locations}
                disabled={submitting}
                t={t}
              />

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting
                  ? t('common.saving')
                  : t('profile.create.createPageSubmit')}
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </main>
  );
}
