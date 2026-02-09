'use client';

import { Megaphone, Search } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { OnboardingFormValues } from '../schemas';

interface StepAccountTypeProps {
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error?: string;
  t: (key: string) => string;
}

export function StepAccountType({
  onSubmit,
  onBack,
  loading,
  error,
  t,
}: StepAccountTypeProps) {
  const { watch, setValue, formState } = useFormContext<OnboardingFormValues>();
  const accountType = watch('accountType');
  const fieldError = formState.errors.accountType?.message;

  return (
    <>
      <CardHeader>
        <CardTitle>
          {t('onboarding.chooseAccountType')}
        </CardTitle>
        <CardDescription>
          {t('onboarding.chooseAccountTypeDesc')}
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
          <div className="space-y-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => setValue('accountType', 'CLIENT')}
              className={`flex w-full items-start gap-4 rounded-lg border p-5 text-left text-base transition-colors ${accountType === 'CLIENT'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/60'
                }`}
            >
              <div className="mt-1 rounded-md bg-primary/10 p-2">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">{t('onboarding.clientTitle')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.clientDesc')}
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => setValue('accountType', 'FREELANCER')}
              className={`flex w-full items-start gap-4 rounded-lg border p-5 text-left text-base transition-colors ${accountType === 'FREELANCER'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/60'
                }`}
            >
              <div className="mt-1 rounded-md bg-primary/10 p-2">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">{t('onboarding.freelancerTitle')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.freelancerDesc')}
                </p>
              </div>
            </button>
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
