'use client';

import { useEffect } from 'react';
import { FormProvider } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { UseFormReturn } from 'react-hook-form';
import type { AuthUser } from '@/lib/api';
import type { OnboardingFormValues } from './schemas';
import type { TranslateFn } from './schemas';
import { StepName, StepPhone, StepCompany } from './steps';
import {
  useOnboardingClient,
  CLIENT_STEP_NAME,
  CLIENT_STEP_PHONE,
  CLIENT_STEP_COMPANY,
} from './useOnboardingClient';

interface OnboardingForClientProps {
  form: UseFormReturn<OnboardingFormValues>;
  t: TranslateFn;
  initialUser: AuthUser;
  initialStep: number;
}

export function OnboardingForClient({
  form,
  t,
  initialUser,
  initialStep,
}: OnboardingForClientProps) {
  const { state, actions } = useOnboardingClient(form, { t });

  useEffect(() => {
    actions.init(initialUser, initialStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when initialUser/initialStep are set
  }, [initialUser?.id, initialStep]);

  if (state.user === null) return null;

  const rootError = form.formState.errors.root?.message;

  return (
    <>
      <div className="flex justify-center p-4 pt-12">
        <FormProvider {...form}>
          <Card className="w-full max-w-md">
            {state.step === CLIENT_STEP_NAME && (
              <StepName
                onSubmit={actions.handleNameSubmit}
                onBack={() => {}}
                loading={state.loading}
                error={rootError}
                t={t}
                showBack={false}
              />
            )}
            {state.step === CLIENT_STEP_PHONE && (
              <StepPhone
                onSubmit={actions.handlePhoneSubmit}
                onBack={() => actions.goToStep(CLIENT_STEP_NAME)}
                loading={state.loading}
                error={rootError}
                t={t}
              />
            )}
            {state.step === CLIENT_STEP_COMPANY && (
              <StepCompany
                onSubmit={actions.handleCompanySubmit}
                onBack={() => actions.goToStep(CLIENT_STEP_PHONE)}
                loading={state.loading}
                error={rootError}
                t={t}
              />
            )}
          </Card>
        </FormProvider>
      </div>

      <Dialog
        open={state.showDraftModal}
        onOpenChange={(open) => !open && actions.closeDraftModal()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('jobs.draftModal.afterLoginTitle')}</DialogTitle>
            <DialogDescription>
              {t('jobs.draftModal.afterLoginDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={actions.finishOnboarding}
              className="w-full sm:w-auto"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={actions.goToNewJob}
              className="w-full sm:w-auto"
            >
              {t('jobs.draftModal.continueEditing')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
