'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  getStoredUser,
  getLocations,
  getContractorProfile,
  updateContractorProfile,
  type Location,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ContractorProfileFormFields } from '@/components/contractor-profile-form-fields';
import {
  profileFormSchema,
  defaultProfileFormValues,
  type ProfileFormValues,
} from '../../../create/schemas';

export default function EditContractorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslations();
  const id = typeof params?.id === 'string' ? params.id : '';
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaultProfileFormValues,
    mode: 'onSubmit',
  });

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!id) {
      setLoading(false);
      setError(t('company.missingProfileId'));
      return;
    }
    Promise.all([getLocations(), getContractorProfile(id)])
      .then(([locs, profile]) => {
        setLocations(locs);
        form.reset({
          name: profile.name ?? '',
          email: profile.email ?? '',
          website: profile.website ?? '',
          phone: profile.phone ?? '',
          locationId: profile.locationId ?? '',
          aboutUs: profile.aboutUs ?? '',
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('company.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [id, router, form, t]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!id) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        website: data.website?.trim() || undefined,
        locationId: data.locationId?.trim() || undefined,
        aboutUs: data.aboutUs?.trim() || undefined,
      };
      await updateContractorProfile(id, payload);
      router.push('/profile');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <main className="max-w-xl mx-auto text-center text-muted-foreground">
          {t('company.loadingProfile')}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <main className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t('company.editTitle')}</CardTitle>
            <CardDescription>
              {t('company.editDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
            )}
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <ContractorProfileFormFields
                  variant="standalone"
                  locations={locations}
                  disabled={submitting}
                />

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? t('common.saving') : t('company.saveChanges')}
                  </Button>
                  <Button type="button" variant="outline" asChild disabled={submitting}>
                    <Link href="/profile">{t('common.cancel')}</Link>
                  </Button>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
