'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getToken,
  getMyProfiles,
  getLocations,
  getContractorProfile,
  updateContractorProfile,
  type Profile,
  type Location,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import { ContractorProfileFormFields } from '@/components/contractor-profile-form-fields';
import {
  profileFormSchema,
  defaultProfileFormValues,
  type ProfileFormValues,
} from '../create/schemas';

export default function ProfileVisitingCardPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [contractorProfiles, setContractorProfiles] = useState<Profile[] | null>(
    null,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaultProfileFormValues,
    mode: 'onSubmit',
  });

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
        if (!cancelled) {
          setContractorProfiles(list);
          if (list?.length) setExpandedId(list[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setContractorProfiles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  useEffect(() => {
    if (!contractorProfiles?.length) return;
    getLocations()
      .then(setLocations)
      .catch(() => {});
  }, [contractorProfiles?.length]);

  useEffect(() => {
    if (!expandedId) return;
    setFormError(null);
    setFormSuccess('');
    getContractorProfile(expandedId)
      .then((profile) => {
        form.reset({
          name: profile.name ?? '',
          email: profile.email ?? '',
          website: profile.website ?? '',
          phone: profile.phone ?? '',
          locationId: profile.locationId ?? '',
          aboutUs: profile.aboutUs ?? '',
        });
      })
      .catch(() => {
        setFormError(t('company.loadFailed'));
      });
  }, [expandedId, form, t]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!expandedId) return;
    setFormError(null);
    setFormSuccess('');
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
      const updated = await updateContractorProfile(expandedId, payload);
      setContractorProfiles((prev) =>
        prev ? prev.map((p) => (p.id === expandedId ? updated : p)) : prev,
      );
      setFormSuccess(t('profile.profileSaved'));
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('profile.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

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
              <Link href="/profile/create">
                {t('profile.contractorProfileCreate')}
              </Link>
            </Button>
          </div>
        )}
        {contractorProfiles &&
          contractorProfiles.length > 0 &&
          contractorProfiles.map((profile) => (
            <div key={profile.id} className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{profile.name}</span>
                    {profile.slug && (
                      <span className="text-sm text-muted-foreground">
                        /company/{profile.slug}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {profile.isVerified
                      ? t('company.verified')
                      : t('company.statusPending')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/company/${profile.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('common.view')}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setExpandedId((prev) =>
                        prev === profile.id ? null : profile.id,
                      )
                    }
                  >
                    {t('common.edit')}
                  </Button>
                </div>
              </div>

              {expandedId === profile.id && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h3 className="text-base font-semibold">
                      {t('company.editTitle')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('company.editDescription')}
                    </p>
                  </div>
                  {formError && (
                    <p className="text-sm text-destructive">{formError}</p>
                  )}
                  {formSuccess && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {formSuccess}
                    </p>
                  )}
                  <FormProvider {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <ContractorProfileFormFields
                        variant="standalone"
                        locations={locations}
                        disabled={submitting}
                        t={t}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={submitting}>
                          {submitting
                            ? t('common.saving')
                            : t('company.saveChanges')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setExpandedId(null)}
                          disabled={submitting}
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </form>
                  </FormProvider>
                </div>
              )}
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
