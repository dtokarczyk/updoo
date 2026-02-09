'use client';

import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ContractorProfileFormFields } from '@/components/contractor-profile-form-fields';

interface StepProfileFormProps {
  locations: { id: string; name: string; slug: string }[];
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error?: string;
  t: (key: string) => string;
}

export function StepProfileForm({
  locations,
  onSubmit,
  onBack,
  loading,
  error,
  t,
}: StepProfileFormProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-3xl">
          {t('onboarding.profileQuestionCreate')}
        </CardTitle>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error}
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
