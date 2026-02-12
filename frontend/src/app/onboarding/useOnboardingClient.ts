'use client';

import { useCallback, useReducer } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  updateProfile,
  updateStoredUser,
  getDraftJob,
  unlinkCompany,
  updateCompany,
  type AuthUser,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { TranslateFn } from './schemas';
import {
  type OnboardingFormValues,
  stepNameSchema,
  stepPhoneSchema,
  stepCompanySchema,
} from './schemas';

export const CLIENT_STEP_NAME = 0;
export const CLIENT_STEP_PHONE = 1;
export const CLIENT_STEP_COMPANY = 2;

interface ClientOnboardingState {
  user: AuthUser | null;
  step: number;
  loading: boolean;
  showDraftModal: boolean;
}

type ClientOnboardingAction =
  | { type: 'INIT'; payload: { user: AuthUser; step: number } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SHOW_DRAFT_MODAL'; payload: boolean }
  | { type: 'SET_USER'; payload: AuthUser };

function clientOnboardingReducer(
  state: ClientOnboardingState,
  action: ClientOnboardingAction,
): ClientOnboardingState {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        user: action.payload.user,
        step: action.payload.step,
      };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SHOW_DRAFT_MODAL':
      return { ...state, showDraftModal: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

const initialState: ClientOnboardingState = {
  user: null,
  step: CLIENT_STEP_NAME,
  loading: false,
  showDraftModal: false,
};

export interface UseOnboardingClientOptions {
  t: TranslateFn;
}

export function useOnboardingClient(
  form: UseFormReturn<OnboardingFormValues>,
  options: UseOnboardingClientOptions,
) {
  const { t } = options;
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [state, dispatch] = useReducer(clientOnboardingReducer, initialState);

  const { getValues, setError, clearErrors } = form;

  const setValidationErrors = useCallback(
    (issues: { path: unknown[]; message: string }[]) => {
      clearErrors();
      issues.forEach((issue) => {
        const path0 = issue.path[0];
        if (typeof path0 === 'string')
          setError(path0 as keyof OnboardingFormValues, {
            message: issue.message,
          });
      });
    },
    [clearErrors, setError],
  );

  const init = useCallback((user: AuthUser, step: number) => {
    dispatch({ type: 'INIT', payload: { user, step } });
  }, []);

  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const openDraftModal = useCallback(() => {
    dispatch({ type: 'SET_SHOW_DRAFT_MODAL', payload: true });
  }, []);

  const closeDraftModal = useCallback(() => {
    dispatch({ type: 'SET_SHOW_DRAFT_MODAL', payload: false });
  }, []);

  const finishOnboarding = useCallback(() => {
    closeDraftModal();
    refreshAuth();
    router.push('/');
    router.refresh();
  }, [closeDraftModal, refreshAuth, router]);

  const goToNewJob = useCallback(() => {
    closeDraftModal();
    refreshAuth();
    router.push('/job/new');
    router.refresh();
  }, [closeDraftModal, refreshAuth, router]);

  const handleNameSubmit = useCallback(async () => {
    clearErrors();
    dispatch({ type: 'SET_LOADING', payload: true });
    const raw = getValues();
    const result = stepNameSchema(t).safeParse({
      name: raw.name,
      surname: raw.surname,
    });
    if (!result.success) {
      setValidationErrors(result.error.issues);
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      const { user: updated } = await updateProfile({
        name: result.data.name.trim(),
        surname: result.data.surname.trim(),
      });
      updateStoredUser(updated);
      dispatch({ type: 'SET_USER', payload: updated });
      dispatch({ type: 'SET_STEP', payload: CLIENT_STEP_PHONE });
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [t, clearErrors, getValues, setError, setValidationErrors]);

  const handlePhoneSubmit = useCallback(async () => {
    clearErrors();
    dispatch({ type: 'SET_LOADING', payload: true });
    const raw = getValues();
    const result = stepPhoneSchema.safeParse({ phone: raw.phone });
    if (!result.success) {
      setValidationErrors(result.error.issues);
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      const { user: updated } = await updateProfile({
        phone: (result.data.phone ?? '').trim() || undefined,
      });
      updateStoredUser(updated);
      dispatch({ type: 'SET_USER', payload: updated });
      dispatch({ type: 'SET_STEP', payload: CLIENT_STEP_COMPANY });
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [clearErrors, getValues, setError, setValidationErrors, t]);

  const handleCompanyFetched = useCallback((user: AuthUser) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const handleCompanySubmit = useCallback(async () => {
    clearErrors();
    dispatch({ type: 'SET_LOADING', payload: true });
    const raw = getValues();
    const result = stepCompanySchema(t).safeParse({
      hasCompany: raw.hasCompany,
      nipCompany: raw.nipCompany,
      companySize: raw.companySize,
    });
    if (!result.success) {
      setValidationErrors(result.error.issues);
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      if (result.data.hasCompany && result.data.companySize) {
        await updateCompany({
          companySize: result.data.companySize,
        });
      } else if (!result.data.hasCompany) {
        const { user: updated } = await unlinkCompany();
        updateStoredUser(updated);
        dispatch({ type: 'SET_USER', payload: updated });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
      const draft = getDraftJob();
      if (draft) openDraftModal();
      else finishOnboarding();
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [
    t,
    clearErrors,
    getValues,
    setError,
    setValidationErrors,
    openDraftModal,
    finishOnboarding,
  ]);

  return {
    state,
    actions: {
      init,
      goToStep,
      handleNameSubmit,
      handlePhoneSubmit,
      handleCompanyFetched,
      handleCompanySubmit,
      openDraftModal,
      closeDraftModal,
      finishOnboarding,
      goToNewJob,
    },
  };
}
