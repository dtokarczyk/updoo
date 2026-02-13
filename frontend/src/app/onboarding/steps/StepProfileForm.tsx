'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ContractorProfileFormFields } from '@/components/contractor-profile-form-fields';
import {
  getLocations,
  createContractorProfile,
  getDraftJob,
} from '@/lib/api';
import { stepProfileFormSchema } from '../schemas';
import type { OnboardingFormValues, TranslateFn } from '../schemas';

function setValidationErrors(
  setError: (name: keyof OnboardingFormValues, error: { message: string }) => void,
  clearErrors: () => void,
  issues: { path: unknown[]; message: string }[],
) {
  clearErrors();
  issues.forEach((issue) => {
    const path0 = issue.path[0];
    if (typeof path0 === 'string')
      setError(path0 as keyof OnboardingFormValues, { message: issue.message });
  });
}

interface StepProfileFormProps {
  onOpenDraftModal: () => void;
  onFinishOnboarding: () => void;
  onBack: () => void;
  t: TranslateFn;
}

export function StepProfileForm({
  onOpenDraftModal,
  onFinishOnboarding,
  onBack,
  t,
}: StepProfileFormProps) {
  const { getValues, setError, clearErrors, formState } =
    useFormContext<OnboardingFormValues>();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<
    { id: string; name: string; slug: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    getLocations()
      .then((locs) => {
        if (!cancelled) setLocations(locs);
      })
      .catch(() => {
        if (!cancelled) setLocations([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    const raw = getValues();
    const result = stepProfileFormSchema.safeParse({
      profileName: raw.profileName,
      profileEmail: raw.profileEmail,
      profileWebsite: raw.profileWebsite,
      profilePhone: raw.profilePhone,
      profileLocationId: raw.profileLocationId,
      profileAboutUs: raw.profileAboutUs,
    });
    if (!result.success) {
      setValidationErrors(setError, clearErrors, result.error.issues);
      setLoading(false);
      return;
    }
    try {
      await createContractorProfile({
        name: result.data.profileName.trim(),
        email: result.data.profileEmail?.trim() || undefined,
        phone: result.data.profilePhone?.trim() || undefined,
        website: result.data.profileWebsite?.trim() || undefined,
        locationId: result.data.profileLocationId?.trim() || undefined,
        aboutUs: result.data.profileAboutUs?.trim() || undefined,
      });
      setLoading(false);
      const draft = getDraftJob();
      if (draft) {
        onOpenDraftModal();
      } else {
        onFinishOnboarding();
      }
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
      setLoading(false);
      return;
    }
  }

  const rootError = formState.errors.root?.message;

  return (
    <>
      <CardHeader>
        <CardTitle>{t('onboarding.profileQuestionCreate')}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {rootError && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {rootError}
            </p>
          )}

          <ContractorProfileFormFields
            variant="onboarding"
            locations={locations}
            disabled={loading}
            size="lg"
            t={t}
          />
        </CardContent>
        <CardFooter className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 text-base"
            size="lg"
            disabled={loading}
            onClick={onBack}
          >
            {t('common.back')}
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 text-base"
            size="lg"
            disabled={loading}
          >
            {loading ? t('onboarding.saving') : t('common.continue')}
          </Button>
        </CardFooter>
      </form>
    </>
  );
}
