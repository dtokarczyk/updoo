'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SkillsFormFields } from '@/components/skills-form-fields';
import { getSkills, updateProfile, updateStoredUser } from '@/lib/api';
import type { AuthUser, Skill } from '@/lib/api';
import { stepSkillsSchema } from '../schemas';
import type { OnboardingFormValues, TranslateFn } from '../schemas';

const formId = 'onboarding-skills-form';

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

interface StepSkillsProps {
  onSuccess: (user: AuthUser) => void;
  onBack: () => void;
  t: TranslateFn;
}

export function StepSkills({ onSuccess, onBack, t }: StepSkillsProps) {
  const { getValues, setError, clearErrors, control, formState } =
    useFormContext<OnboardingFormValues>();
  const [loading, setLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState('');
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);

  useEffect(() => {
    let cancelled = false;
    setSkillsError('');
    setSkillsLoading(true);
    getSkills()
      .then((skills) => {
        if (!cancelled) setAvailableSkills(skills);
      })
      .catch((err) => {
        if (!cancelled) {
          setSkillsError(
            err instanceof Error ? err.message : t('onboarding.saveFailed'),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSkillsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    const raw = getValues();
    const result = stepSkillsSchema.safeParse({
      selectedSkillIds: raw.selectedSkillIds,
    });
    if (!result.success) {
      setValidationErrors(setError, clearErrors, result.error.issues);
      setLoading(false);
      return;
    }
    try {
      const { user: updated } = await updateProfile({
        skillIds: result.data.selectedSkillIds,
      });
      updateStoredUser(updated);
      onSuccess(updated);
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
    } finally {
      setLoading(false);
    }
  }

  const rootError = formState.errors.root?.message;
  const displayError = rootError ?? skillsError;

  return (
    <>
      <CardHeader>
        <CardTitle>{t('onboarding.freelancerSkillsTitle')}</CardTitle>
        <CardDescription>
          {t('onboarding.freelancerSkillsDesc')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {displayError && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {displayError}
            </p>
          )}
          <SkillsFormFields<OnboardingFormValues>
            control={control}
            name="selectedSkillIds"
            availableSkills={availableSkills}
            skillsLoading={skillsLoading}
            disabled={loading}
            formId={formId}
            searchPlaceholder={t(
              'onboarding.freelancerSkillsSearchPlaceholder',
            )}
            emptyLabel={t('onboarding.freelancerSkillsEmpty')}
            noResultsLabel={t('onboarding.freelancerSkillsNoResults')}
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
