'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import {
  getStoredUser,
  updateProfile,
  updateStoredUser,
  needsOnboarding,
} from '@/lib/api';
import type { AuthUser } from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import { defaultOnboardingValues, type OnboardingFormValues } from './schemas';
import { stepAccountTypeSchema } from './schemas';
import { StepAccountType } from './steps';
import { OnboardingForClient } from './OnboardingForClient';
import { OnboardingForFreelancer } from './OnboardingForFreelancer';
import {
  CLIENT_STEP_NAME,
  CLIENT_STEP_PHONE,
  CLIENT_STEP_COMPANY,
} from './useOnboardingClient';
import {
  FREELANCER_STEP_NAME,
  FREELANCER_STEP_PHONE,
  FREELANCER_STEP_COMPANY,
  FREELANCER_STEP_SKILLS,
  FREELANCER_STEP_DEFAULT_MESSAGE,
  FREELANCER_STEP_CATEGORIES,
} from './useOnboardingFreelancer';

function getClientInitialStep(stored: AuthUser): number {
  const hasName =
    (stored.name ?? '').trim() !== '' && (stored.surname ?? '').trim() !== '';
  const hasPhone = (stored.phone ?? '').trim() !== '';
  if (!hasName) return CLIENT_STEP_NAME;
  if (!hasPhone) return CLIENT_STEP_PHONE;
  return CLIENT_STEP_COMPANY;
}

function getFreelancerInitialStep(stored: AuthUser): number {
  const hasName =
    (stored.name ?? '').trim() !== '' && (stored.surname ?? '').trim() !== '';
  const hasPhone = (stored.phone ?? '').trim() !== '';
  const hasSkills = (stored.skills?.length ?? 0) > 0;
  const hasDefaultMessage = (stored.defaultMessage?.trim() ?? '').length > 0;
  // Company step done: user has a company (NIP/companyId) OR has already passed it (has skills)
  const companyDone =
    stored.companyId != null ||
    (stored.nipCompany != null && (stored.nipCompany ?? '').trim() !== '') ||
    hasSkills;
  if (!hasName) return FREELANCER_STEP_NAME;
  if (!hasPhone) return FREELANCER_STEP_PHONE;
  if (!companyDone) return FREELANCER_STEP_COMPANY;
  if (!hasSkills) return FREELANCER_STEP_SKILLS;
  if (!hasDefaultMessage) return FREELANCER_STEP_DEFAULT_MESSAGE;
  return FREELANCER_STEP_CATEGORIES;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const force = searchParams.get('force') === 'true';
  const { t } = useTranslations();

  const [storedUser, setStoredUser] = useState<AuthUser | null>(null);
  const [accountType, setAccountType] = useState<
    'CLIENT' | 'FREELANCER' | null
  >(null);
  const [accountTypeLoading, setAccountTypeLoading] = useState(false);
  const [accountTypeError, setAccountTypeError] = useState('');

  const form = useForm<OnboardingFormValues>({
    defaultValues: defaultOnboardingValues,
    mode: 'onSubmit',
  });

  // Run init exactly once. Using [] deps so that router reference changes
  // (which can happen in Next.js App Router) don't re-trigger this effect
  // and accidentally redirect away from the onboarding flow.
  useEffect(() => {
    const stored = getStoredUser();
    if (stored === null) {
      router.replace('/login');
      return;
    }
    if (!force && !needsOnboarding(stored)) {
      router.replace('/');
      return;
    }
    setStoredUser(stored);
    setAccountType(
      stored.accountType === 'CLIENT' || stored.accountType === 'FREELANCER'
        ? stored.accountType
        : null,
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
      companySize:
        stored.companySize &&
        ['FREELANCER', 'MICRO', 'SMALL', 'MEDIUM', 'LARGE'].includes(
          stored.companySize,
        )
          ? stored.companySize
          : null,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAccountTypeSubmit() {
    setAccountTypeError('');
    setAccountTypeLoading(true);
    const raw = form.getValues();
    const result = stepAccountTypeSchema(t).safeParse({
      accountType: raw.accountType,
    });
    if (!result.success) {
      form.setError('accountType', {
        message:
          result.error.issues[0]?.message ??
          t('onboarding.accountTypeRequired'),
      });
      setAccountTypeLoading(false);
      return;
    }
    try {
      const { user: updated } = await updateProfile({
        accountType: result.data.accountType,
      });
      updateStoredUser(updated);
      setStoredUser(updated);
      setAccountType(updated.accountType as 'CLIENT' | 'FREELANCER');
    } catch (err) {
      setAccountTypeError(
        err instanceof Error ? err.message : t('onboarding.saveFailed'),
      );
    } finally {
      setAccountTypeLoading(false);
    }
  }

  // Still loading initial user / redirect
  if (storedUser === null && accountType === null) return null;

  // Step 1: choose account type (only when not yet chosen)
  if (accountType === null && storedUser !== null) {
    return (
      <div className="flex justify-center p-4 pt-12">
        <FormProvider {...form}>
          <Card className="w-full max-w-md">
            <StepAccountType
              onSubmit={handleAccountTypeSubmit}
              onBack={() => {}}
              loading={accountTypeLoading}
              error={accountTypeError}
              t={t}
              showBack={false}
            />
          </Card>
        </FormProvider>
      </div>
    );
  }

  // Step 2: full flow for client or freelancer
  if (storedUser === null) return null;

  if (accountType === 'CLIENT') {
    const initialStep = force
      ? CLIENT_STEP_NAME
      : getClientInitialStep(storedUser);
    return (
      <OnboardingForClient
        form={form}
        t={t}
        initialUser={storedUser}
        initialStep={initialStep}
      />
    );
  }

  const initialStep = force
    ? FREELANCER_STEP_NAME
    : getFreelancerInitialStep(storedUser);
  return (
    <OnboardingForFreelancer
      form={form}
      t={t}
      initialUser={storedUser}
      initialStep={initialStep}
    />
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}
