'use client';

import { Building2, UserCircle } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { OnboardingFormValues } from '../schemas';

interface StepCompanyProps {
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error?: string;
  t: (key: string) => string;
}

export function StepCompany({
  onSubmit,
  onBack,
  loading,
  error,
  t,
}: StepCompanyProps) {
  const { watch, setValue, register, formState } =
    useFormContext<OnboardingFormValues>();
  const hasCompany = watch('hasCompany');
  const fieldError =
    formState.errors.hasCompany?.message ??
    formState.errors.nipCompany?.message;

  return (
    <>
      <CardHeader>
        <CardTitle className="text-3xl">
          {t('onboarding.companyTitle')}
        </CardTitle>
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
          <div className="space-y-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => setValue('hasCompany', true)}
              className={`flex w-full items-center gap-4 rounded-lg border p-5 text-left text-base transition-colors ${
                hasCompany === true
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/60'
              }`}
            >
              <div className="shrink-0 rounded-md bg-primary/10 p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">
                {t('onboarding.companyHasCompany')}
              </span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setValue('hasCompany', false);
                setValue('nipCompany', '');
              }}
              className={`flex w-full items-center gap-4 rounded-lg border p-5 text-left text-base transition-colors ${
                hasCompany === false
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/60'
              }`}
            >
              <div className="shrink-0 rounded-md bg-primary/10 p-2">
                <UserCircle className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">
                {t('onboarding.companyNoCompany')}
              </span>
            </button>
          </div>
          {hasCompany === true && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="nipCompany">{t('profile.nipCompany')}</Label>
              <Input
                id="nipCompany"
                type="text"
                placeholder={t('onboarding.companyNipPlaceholder')}
                {...register('nipCompany', {
                  setValueAs: (v: string) =>
                    (v ?? '').replace(/\D/g, '').slice(0, 10),
                })}
                disabled={loading}
                maxLength={10}
                className="h-12 text-base px-4"
              />
            </div>
          )}
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
