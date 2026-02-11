'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
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
import { getStoredUser } from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import { defaultOnboardingValues, type OnboardingFormValues } from './schemas';
import {
  StepPhone,
  StepName,
  StepAccountType,
  StepCompany,
  StepSkills,
  StepDefaultMessage,
  StepProfileQuestion,
  StepProfileForm,
} from './steps';
import {
  useOnboarding,
  STEP_NAME,
  STEP_PHONE,
  STEP_ACCOUNT_TYPE,
  STEP_COMPANY,
  STEP_SKILLS,
  STEP_DEFAULT_MESSAGE,
  STEP_PROFILE_QUESTION,
  STEP_PROFILE_FORM,
} from './useOnboarding';

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const form = useForm<OnboardingFormValues>({
    defaultValues: defaultOnboardingValues,
    mode: 'onSubmit',
  });

  const {
    state,
    accountType,
    actions,
    needsOnboarding: checkNeedsOnboarding,
  } = useOnboarding(form, { t });

  useEffect(() => {
    const stored = getStoredUser();
    if (stored === null) {
      router.replace('/login');
      return;
    }
    if (!checkNeedsOnboarding(stored)) {
      router.replace('/');
      return;
    }
    const reasons: string[] = [];
    if (!(stored.phone != null && stored.phone.trim() !== ''))
      reasons.push('brak lub pusty telefon');
    if (stored.name == null || (stored.name?.trim() ?? '') === '')
      reasons.push('brak imienia lub nazwiska');
    if (stored.accountType == null) reasons.push('brak typu konta');
    if (
      stored.accountType === 'FREELANCER' &&
      (stored.skills?.length ?? 0) === 0
    )
      reasons.push('freelancer bez wybranych umiejętności');
    console.log(
      '[onboarding] Wyświetlam onboarding, powody:',
      reasons.join(', '),
    );
    form.reset({
      phone: stored.phone ?? '',
      name: stored.name ?? '',
      surname: stored.surname ?? '',
      accountType:
        (stored.accountType as OnboardingFormValues['accountType']) ?? '',
      hasCompany:
        stored.nipCompany != null && stored.nipCompany.trim() !== ''
          ? true
          : stored.nipCompany != null
            ? false
            : null,
      nipCompany: stored.nipCompany ?? '',
      selectedSkillIds: Array.isArray(stored.skills)
        ? stored.skills.map((s) => s.id)
        : [],
      defaultMessage: stored.defaultMessage ?? '',
      wantsProfile: null,
      profileName: '',
      profileEmail: '',
      profileWebsite: '',
      profilePhone: '',
      profileLocationId: '',
      profileAboutUs: '',
    });
    const hasName =
      (stored.name ?? '').trim() !== '' && (stored.surname ?? '').trim() !== '';
    const hasPhone = (stored.phone ?? '').trim() !== '';
    const companyDone = stored.nipCompany != null;
    let step = STEP_NAME;
    if (!hasName) step = STEP_NAME;
    else if (!hasPhone) step = STEP_PHONE;
    else if (stored.accountType == null) step = STEP_ACCOUNT_TYPE;
    else if (!companyDone) step = STEP_COMPANY;
    else if (
      stored.accountType === 'FREELANCER' &&
      (stored.skills?.length ?? 0) === 0
    )
      step = STEP_SKILLS;
    else if (
      stored.accountType === 'FREELANCER' &&
      (stored.skills?.length ?? 0) > 0 &&
      (stored.defaultMessage == null || stored.defaultMessage.trim() === '')
    )
      step = STEP_DEFAULT_MESSAGE;
    else step = STEP_COMPANY;
    actions.init(stored, step);
    // Omit actions/actions.init from deps to avoid infinite loop: actions is recreated every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run only on mount/router/checkNeedsOnboarding
  }, [router, checkNeedsOnboarding]);

  if (state.user === null) return null;

  const rootError = form.formState.errors.root?.message;

  return (
    <div className="flex justify-center p-4 pt-12">
      <FormProvider {...form}>
        <Card className="w-full max-w-md">
          {state.step === STEP_NAME && (
            <StepName
              onSubmit={actions.handleNameSubmit}
              onBack={() => {}}
              loading={state.loading}
              error={rootError}
              t={t}
              showBack={false}
            />
          )}
          {state.step === STEP_PHONE && (
            <StepPhone
              onSubmit={actions.handlePhoneSubmit}
              onBack={() => actions.goToStep(STEP_NAME)}
              loading={state.loading}
              error={rootError}
              t={t}
            />
          )}
          {state.step === STEP_ACCOUNT_TYPE && (
            <StepAccountType
              onSubmit={actions.handleAccountTypeSubmit}
              onBack={() => actions.goToStep(STEP_PHONE)}
              loading={state.loading}
              error={rootError}
              t={t}
            />
          )}
          {state.step === STEP_COMPANY && (
            <StepCompany
              onSubmit={actions.handleCompanySubmit}
              onBack={() => actions.goToStep(STEP_ACCOUNT_TYPE)}
              loading={state.loading}
              error={rootError}
              t={t}
            />
          )}
          {state.step === STEP_SKILLS && accountType === 'FREELANCER' && (
            <StepSkills
              availableSkills={state.availableSkills}
              skillsLoading={state.skillsLoading}
              skillsError={state.skillsError}
              onSubmit={actions.handleSkillsSubmit}
              onBack={() => actions.goToStep(STEP_COMPANY)}
              loading={state.loading}
              error={rootError}
              t={t}
            />
          )}
          {state.step === STEP_DEFAULT_MESSAGE &&
            accountType === 'FREELANCER' && (
              <StepDefaultMessage
                onSubmit={actions.handleDefaultMessageSubmit}
                onBack={() => actions.goToStep(STEP_SKILLS)}
                loading={state.loading}
                error={rootError}
                t={t}
              />
            )}
          {state.step === STEP_PROFILE_QUESTION && (
            <StepProfileQuestion
              onYes={actions.handleProfileQuestionYes}
              onNo={actions.handleProfileQuestionNo}
              loading={state.loading}
              error={rootError}
              t={t}
            />
          )}
          {state.step === STEP_PROFILE_FORM && (
            <StepProfileForm
              locations={state.availableLocations}
              onSubmit={actions.handleProfileFormSubmit}
              onBack={() => actions.goToStep(STEP_PROFILE_QUESTION)}
              loading={state.loading}
              error={rootError}
              t={t}
            />
          )}
        </Card>
      </FormProvider>

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
          <DialogFooter className="flex-col sm:flex-row gap-2">
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
    </div>
  );
}
