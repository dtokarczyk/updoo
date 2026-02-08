'use client';

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
import type { OnboardingFormValues } from '../schemas';

interface StepDefaultMessageProps {
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error?: string;
  t: (key: string) => string;
}

export function StepDefaultMessage({
  onSubmit,
  onBack,
  loading,
  error,
  t,
}: StepDefaultMessageProps) {
  const { register, formState } = useFormContext<OnboardingFormValues>();
  const fieldError = formState.errors.defaultMessage?.message;

  return (
    <>
      <CardHeader>
        <CardTitle className="text-3xl">
          {t('onboarding.freelancerDefaultMessageTitle')}
        </CardTitle>
        <CardDescription>
          {t('onboarding.freelancerDefaultMessageDesc')}
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <CardContent className="space-y-4">
          {(error || fieldError) && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error ?? fieldError}
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
