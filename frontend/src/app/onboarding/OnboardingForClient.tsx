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
import { getDraftJob } from '@/lib/api';
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
  const { state, actions } = useOnboardingClient({ t });

  useEffect(() => {
    actions.init(initialUser, initialStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when initialUser/initialStep are set
  }, [initialUser?.id, initialStep]);

  if (state.user === null) return null;

  return (
    <>
      <div className="flex justify-center p-4 pt-12">
        <FormProvider {...form}>
          <Card className="w-full max-w-md">
            {state.step === CLIENT_STEP_NAME && (
              <StepName
                onSuccess={(user) => {
                  actions.setUser(user);
                  actions.goToStep(CLIENT_STEP_PHONE);
                }}
                onBack={() => {}}
                t={t}
                showBack={false}
              />
            )}
            {state.step === CLIENT_STEP_PHONE && (
              <StepPhone
                onSuccess={(user) => {
                  actions.setUser(user);
                  actions.goToStep(CLIENT_STEP_COMPANY);
                }}
                onBack={() => actions.goToStep(CLIENT_STEP_NAME)}
                t={t}
              />
            )}
            {state.step === CLIENT_STEP_COMPANY && (
              <StepCompany
                onSuccess={() => {
                  const draft = getDraftJob();
                  if (draft) actions.openDraftModal();
                  else actions.finishOnboarding();
                }}
                onBack={() => actions.goToStep(CLIENT_STEP_PHONE)}
                t={t}
                onCompanyFetched={actions.setUser}
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
            <Button onClick={actions.goToNewJob} className="w-full sm:w-auto">
              {t('jobs.draftModal.continueEditing')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
