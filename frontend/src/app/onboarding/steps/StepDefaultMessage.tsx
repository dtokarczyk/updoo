'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { updateProfile, updateStoredUser } from '@/lib/api';
import type { AuthUser } from '@/lib/api';
import { stepDefaultMessageSchema } from '../schemas';
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

interface StepDefaultMessageProps {
  onSuccess: (user: AuthUser) => void;
  onBack: () => void;
  t: TranslateFn;
}

export function StepDefaultMessage({
  onSuccess,
  onBack,
  t,
}: StepDefaultMessageProps) {
  const { getValues, setError, clearErrors, register, formState } =
    useFormContext<OnboardingFormValues>();
  const [loading, setLoading] = useState(false);

  const fieldError = formState.errors.defaultMessage?.message;
  const rootError = formState.errors.root?.message;
  const displayError = rootError ?? fieldError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();
    setLoading(true);
    const raw = getValues();
    const result = stepDefaultMessageSchema.safeParse({
      defaultMessage: raw.defaultMessage,
    });
    if (!result.success) {
      setValidationErrors(setError, clearErrors, result.error.issues);
      setLoading(false);
      return;
    }
    try {
      const { user: updated } = await updateProfile({
        defaultMessage: (result.data.defaultMessage ?? '').trim() || undefined,
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
        <CardTitle>{t('onboarding.freelancerDefaultMessageTitle')}</CardTitle>
        <CardDescription>
          {t('onboarding.freelancerDefaultMessageDesc')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {displayError && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {displayError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="defaultMessage">
              {t('profile.defaultMessage')}
            </Label>
            <Textarea
              id="defaultMessage"
              placeholder={t('onboarding.freelancerDefaultMessagePlaceholder')}
              {...register('defaultMessage')}
              rows={8}
              disabled={loading}
              className="resize-none min-h-[12rem] text-base px-4 py-3"
            />
            <p className="text-xs text-muted-foreground">
              {t('onboarding.freelancerDefaultMessageHint')}
            </p>
          </div>
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
