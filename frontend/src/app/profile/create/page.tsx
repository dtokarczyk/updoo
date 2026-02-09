'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  getStoredUser,
  getLocations,
  getMyProfiles,
  createContractorProfile,
  type Location,
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
import {
  profileFormSchema,
  defaultProfileFormValues,
  type ProfileFormValues,
} from './schemas';

export default function CreateProfilePage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    getLocations()
      .then(setLocations)
      .catch(() => setLocations([]));
    getMyProfiles()
      .then((profiles) => {
        if (profiles.length > 0) router.replace('/profile/edit');
      })
      .catch(() => { });
  }, [router]);

  const onSubmit = async (data: ProfileFormValues) => {
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
      await createContractorProfile(payload);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się utworzyć profilu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <main className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Załóż profil wykonawcy</CardTitle>
            <CardDescription>
              Profil pozwala zaprezentować firmę lub osobę prywatną. Po weryfikacji
              będzie widoczny pod adresem /company/nazwa-profilu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <ContractorProfileFormFields
                  variant="standalone"
                  locations={locations}
                  disabled={submitting}
                />

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Zapisywanie...' : 'Utwórz profil'}
                  </Button>
                  <Button type="button" variant="outline" asChild disabled={submitting}>
                    <Link href="/">Anuluj</Link>
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
