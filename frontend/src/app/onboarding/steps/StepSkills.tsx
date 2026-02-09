'use client';

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
import type { Skill } from '@/lib/api';
import type { OnboardingFormValues } from '../schemas';

const formId = 'onboarding-skills-form';

interface StepSkillsProps {
  availableSkills: Skill[];
  skillsLoading: boolean;
  skillsError: string;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error?: string;
  t: (key: string) => string;
}

export function StepSkills({
  availableSkills,
  skillsLoading,
  skillsError,
  onSubmit,
  onBack,
  loading,
  error,
  t,
}: StepSkillsProps) {
  const { control } = useFormContext<OnboardingFormValues>();

  return (
    <>
      <CardHeader>
        <CardTitle className="text-3xl">
          {t('onboarding.freelancerSkillsTitle')}
        </CardTitle>
        <CardDescription>
          {t('onboarding.freelancerSkillsDesc')}
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <CardContent className="space-y-4">
          {(error || skillsError) && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error ?? skillsError}
            </p>
          )}
          <SkillsFormFields<OnboardingFormValues>
            control={control}
            name="selectedSkillIds"
            availableSkills={availableSkills}
            skillsLoading={skillsLoading}
            disabled={loading}
            formId={formId}
            searchPlaceholder={t('onboarding.freelancerSkillsSearchPlaceholder')}
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
