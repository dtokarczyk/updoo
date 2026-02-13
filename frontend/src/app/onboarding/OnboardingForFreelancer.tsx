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
import {
  StepName,
  StepPhone,
  StepCompany,
  StepSkills,
  StepDefaultMessage,
  StepCategories,
  StepProfileQuestion,
  StepProfileForm,
} from './steps';
import {
  useOnboardingFreelancer,
  FREELANCER_STEP_NAME,
  FREELANCER_STEP_PHONE,
  FREELANCER_STEP_COMPANY,
  FREELANCER_STEP_SKILLS,
  FREELANCER_STEP_DEFAULT_MESSAGE,
  FREELANCER_STEP_CATEGORIES,
  FREELANCER_STEP_PROFILE_QUESTION,
  FREELANCER_STEP_PROFILE_FORM,
} from './useOnboardingFreelancer';

interface OnboardingForFreelancerProps {
  form: UseFormReturn<OnboardingFormValues>;
  t: TranslateFn;
  initialUser: AuthUser;
  initialStep: number;
}

export function OnboardingForFreelancer({
  form,
  t,
  initialUser,
  initialStep,
}: OnboardingForFreelancerProps) {
  const { state, actions } = useOnboardingFreelancer({ t });

  useEffect(() => {
    if (initialUser) actions.init(initialUser, initialStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only when user id changes
  }, [initialUser?.id]);

  if (state.user === null) return null;

  return (
    <>
      <div className="flex justify-center p-4 pt-12">
        <FormProvider {...form}>
          <Card className="w-full max-w-md">
            {state.step === FREELANCER_STEP_NAME && (
              <StepName
                onSuccess={(user) => {
                  actions.setUser(user);
                  actions.goToStep(FREELANCER_STEP_PHONE);
                }}
                onBack={() => { }}
                t={t}
                showBack={false}
              />
            )}
            {state.step === FREELANCER_STEP_PHONE && (
              <StepPhone
                onSuccess={(user) => {
                  actions.setUser(user);
                  actions.goToStep(FREELANCER_STEP_COMPANY);
                }}
                onBack={() => actions.goToStep(FREELANCER_STEP_NAME)}
                t={t}
              />
            )}
            {state.step === FREELANCER_STEP_COMPANY && (
              <StepCompany
                onSuccess={() => actions.goToStep(FREELANCER_STEP_SKILLS)}
                onBack={() => actions.goToStep(FREELANCER_STEP_PHONE)}
                t={t}
                onCompanyFetched={actions.setUser}
              />
            )}
            {state.step === FREELANCER_STEP_SKILLS && (
              <StepSkills
                onSuccess={(user) => {
                  actions.setUser(user);
                  actions.goToStep(FREELANCER_STEP_DEFAULT_MESSAGE);
                }}
                onBack={() => actions.goToStep(FREELANCER_STEP_COMPANY)}
                t={t}
              />
            )}
            {state.step === FREELANCER_STEP_DEFAULT_MESSAGE && (
              <StepDefaultMessage
                onSuccess={(user) => {
                  actions.setUser(user);
                  actions.goToStep(FREELANCER_STEP_CATEGORIES);
                }}
                onBack={() => actions.goToStep(FREELANCER_STEP_SKILLS)}
                t={t}
              />
            )}
            {state.step === FREELANCER_STEP_CATEGORIES && (
              <StepCategories
                onSuccess={() =>
                  actions.goToStep(FREELANCER_STEP_PROFILE_QUESTION)
                }
                onBack={() =>
                  actions.goToStep(FREELANCER_STEP_DEFAULT_MESSAGE)
                }
                t={t}
              />
            )}
            {state.step === FREELANCER_STEP_PROFILE_QUESTION && (
              <StepProfileQuestion
                onYes={() => actions.goToStep(FREELANCER_STEP_PROFILE_FORM)}
                onNo={() => {
                  const draft = getDraftJob();
                  if (draft) actions.openDraftModal();
                  else actions.finishOnboarding();
                }}
                t={t}
              />
            )}
            {state.step === FREELANCER_STEP_PROFILE_FORM && (
              <StepProfileForm
                onOpenDraftModal={actions.openDraftModal}
                onFinishOnboarding={actions.finishOnboarding}
                onBack={() =>
                  actions.goToStep(FREELANCER_STEP_PROFILE_QUESTION)
                }
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
