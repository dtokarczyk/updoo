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
import {
  StepName,
  StepPhone,
  StepCompany,
  StepSkills,
  StepDefaultMessage,
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
  const { state, actions } = useOnboardingFreelancer(form, { t });

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
            {state.step === FREELANCER_STEP_NAME && (
              <StepName
                onSubmit={actions.handleNameSubmit}
                onBack={() => {}}
                loading={state.loading}
                error={rootError}
                t={t}
                showBack={false}
              />
            )}
            {state.step === FREELANCER_STEP_PHONE && (
              <StepPhone
                onSubmit={actions.handlePhoneSubmit}
                onBack={() => actions.goToStep(FREELANCER_STEP_NAME)}
                loading={state.loading}
                error={rootError}
                t={t}
              />
            )}
            {state.step === FREELANCER_STEP_COMPANY && (
              <StepCompany
                onSubmit={actions.handleCompanySubmit}
                onBack={() => actions.goToStep(FREELANCER_STEP_PHONE)}
                loading={state.loading}
                error={rootError}
                t={t}
              />
            )}
            {state.step === FREELANCER_STEP_SKILLS && (
              <StepSkills
                availableSkills={state.availableSkills}
                skillsLoading={state.skillsLoading}
                skillsError={state.skillsError}
                onSubmit={actions.handleSkillsSubmit}
                onBack={() => actions.goToStep(FREELANCER_STEP_COMPANY)}
                loading={state.loading}
                error={rootError}
                t={t}
              />
            )}
            {state.step === FREELANCER_STEP_DEFAULT_MESSAGE && (
              <StepDefaultMessage
                onSubmit={actions.handleDefaultMessageSubmit}
                onBack={() => actions.goToStep(FREELANCER_STEP_SKILLS)}
                loading={state.loading}
                error={rootError}
                t={t}
              />
            )}
            {state.step === FREELANCER_STEP_PROFILE_QUESTION && (
              <StepProfileQuestion
                onYes={actions.handleProfileQuestionYes}
                onNo={actions.handleProfileQuestionNo}
                loading={state.loading}
                error={rootError}
                t={t}
              />
            )}
            {state.step === FREELANCER_STEP_PROFILE_FORM && (
              <StepProfileForm
                locations={state.availableLocations}
                onSubmit={actions.handleProfileFormSubmit}
                onBack={() =>
                  actions.goToStep(FREELANCER_STEP_PROFILE_QUESTION)
                }
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
