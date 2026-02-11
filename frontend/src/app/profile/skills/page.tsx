'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SkillsFormFields } from '@/components/skills-form-fields';
import {
  getStoredUser,
  updateProfile,
  updateStoredUser,
  getSkills,
  type Skill,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import {
  getSkillsFormSchema,
  defaultSkillsFormValues,
  type SkillsFormValues,
} from './schema';

const formId = 'profile-skills-form';

export default function ProfileSkillsPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  const form = useForm<SkillsFormValues>({
    resolver: zodResolver(getSkillsFormSchema(t)),
    defaultValues: defaultSkillsFormValues,
    mode: 'onSubmit',
  });

  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = form;

  useEffect(() => {
    const user = getStoredUser();
    if (user && Array.isArray(user.skills)) {
      reset({
        selectedSkillIds: user.skills.map((skill) => skill.id),
      });
    }
  }, [reset]);

  useEffect(() => {
    let cancelled = false;
    async function loadSkills() {
      setSkillsLoading(true);
      try {
        const allSkills = await getSkills();
        if (!cancelled) setSkills(allSkills);
      } finally {
        if (!cancelled) setSkillsLoading(false);
      }
    }
    void loadSkills();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(data: SkillsFormValues) {
    setSubmitError('');
    setSuccess(false);
    try {
      const { user: updated } = await updateProfile({
        skillIds: data.selectedSkillIds,
      });
      updateStoredUser(updated);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('profile.saveFailed'),
      );
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('profile.tabSkills')}</CardTitle>
        <CardDescription>
          {t('onboarding.freelancerSkillsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <form
            id={formId}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <SkillsFormFields
              control={control}
              name="selectedSkillIds"
              availableSkills={skills}
              skillsLoading={skillsLoading}
              disabled={isSubmitting}
              formId={formId}
              searchPlaceholder={t(
                'onboarding.freelancerSkillsSearchPlaceholder',
              )}
              emptyLabel={t('onboarding.freelancerSkillsEmpty')}
              noResultsLabel={t('onboarding.freelancerSkillsNoResults')}
            />
            <CardFooter className="px-0">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('common.saving') : t('common.save')}
              </Button>
            </CardFooter>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
