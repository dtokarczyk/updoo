'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { updateProfile, updateStoredUser } from '@/lib/api';
import type { AuthUser } from '@/lib/api';
import { stepNameSchema } from '../schemas';
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

interface StepNameProps {
  onSuccess: (user: AuthUser) => void;
  onBack: () => void;
  t: TranslateFn;
  showBack?: boolean;
}

export function StepName({
  onSuccess,
  onBack,
  t,
  showBack = true,
}: StepNameProps) {
  const { getValues, setError, clearErrors, formState, register } =
    useFormContext<OnboardingFormValues>();
  const [loading, setLoading] = useState(false);

  const nameError = formState.errors.name?.message;
  const surnameError = formState.errors.surname?.message;
  const rootError = formState.errors.root?.message;
  const displayError = rootError ?? nameError ?? surnameError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    const raw = getValues();
    const result = stepNameSchema(t).safeParse({
      name: raw.name,
      surname: raw.surname,
    });
    if (!result.success) {
      setValidationErrors(setError, clearErrors, result.error.issues);
      setLoading(false);
      return;
    }
    try {
      const { user: updated } = await updateProfile({
        name: result.data.name.trim(),
        surname: result.data.surname.trim(),
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

  return (
    <>
      <CardHeader>
        <CardTitle>{t('onboarding.whatShouldWeCallYou')}</CardTitle>
        <CardDescription>{t('onboarding.enterNameSurname')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {displayError && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {displayError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{t('auth.name')}</Label>
            <Input
              id="name"
              type="text"
              {...register('name')}
              autoComplete="given-name"
              disabled={loading}
              className="h-12 text-base px-4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surname">{t('auth.surname')}</Label>
            <Input
              id="surname"
              type="text"
              {...register('surname')}
              autoComplete="family-name"
              disabled={loading}
              className="h-12 text-base px-4"
            />
          </div>
        </CardContent>
        <CardFooter className="mt-4 flex gap-2">
          {showBack && (
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
          )}
          <Button
            type="submit"
            className={
              showBack ? 'flex-1 h-12 text-base' : 'w-full h-12 text-base'
            }
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
