'use client';

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
import type { OnboardingFormValues } from '../schemas';

interface StepNameProps {
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error?: string;
  t: (key: string) => string;
  /** When false, back button is hidden (e.g. first step). Default true. */
  showBack?: boolean;
}

export function StepName({
  onSubmit,
  onBack,
  loading,
  error,
  t,
  showBack = true,
}: StepNameProps) {
  const { register, formState } = useFormContext<OnboardingFormValues>();
  const nameError = formState.errors.name?.message;
  const surnameError = formState.errors.surname?.message;
  const displayError = error ?? nameError ?? surnameError;

  return (
    <>
      <CardHeader>
        <CardTitle>{t('onboarding.whatShouldWeCallYou')}</CardTitle>
        <CardDescription>{t('onboarding.enterNameSurname')}</CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
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
