'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  updateProfile,
  updateStoredUser,
  getSkills,
  getDraftJob,
  createContractorProfile,
  getLocations,
  unlinkCompany,
  updateCompany,
  type Skill,
  type AuthUser,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { TranslateFn } from './schemas';
import {
  type OnboardingFormValues,
  stepPhoneSchema,
  stepNameSchema,
  stepCompanySchema,
  stepSkillsSchema,
  stepDefaultMessageSchema,
  stepProfileFormSchema,
} from './schemas';

export const FREELANCER_STEP_NAME = 0;
export const FREELANCER_STEP_PHONE = 1;
export const FREELANCER_STEP_COMPANY = 2;
export const FREELANCER_STEP_SKILLS = 3;
export const FREELANCER_STEP_DEFAULT_MESSAGE = 4;
export const FREELANCER_STEP_PROFILE_QUESTION = 5;
export const FREELANCER_STEP_PROFILE_FORM = 6;

export interface FreelancerOnboardingState {
  user: AuthUser | null;
  step: number;
  loading: boolean;
  skillsLoading: boolean;
  skillsError: string;
  availableSkills: Skill[];
  showDraftModal: boolean;
  availableLocations: { id: string; name: string; slug: string }[];
}

type FreelancerOnboardingAction =
  | { type: 'INIT'; payload: { user: AuthUser; step: number } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SKILLS_LOADING'; payload: boolean }
  | { type: 'SET_SKILLS_ERROR'; payload: string }
  | { type: 'SET_AVAILABLE_SKILLS'; payload: Skill[] }
  | { type: 'SET_SHOW_DRAFT_MODAL'; payload: boolean }
  | { type: 'SET_USER'; payload: AuthUser }
  | {
      type: 'SET_AVAILABLE_LOCATIONS';
      payload: { id: string; name: string; slug: string }[];
    };

function freelancerOnboardingReducer(
  state: FreelancerOnboardingState,
  action: FreelancerOnboardingAction,
): FreelancerOnboardingState {
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
    case 'SET_SKILLS_LOADING':
      return { ...state, skillsLoading: action.payload };
    case 'SET_SKILLS_ERROR':
      return { ...state, skillsError: action.payload };
    case 'SET_AVAILABLE_SKILLS':
      return { ...state, availableSkills: action.payload };
    case 'SET_SHOW_DRAFT_MODAL':
      return { ...state, showDraftModal: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AVAILABLE_LOCATIONS':
      return { ...state, availableLocations: action.payload };
    default:
      return state;
  }
}

const initialState: FreelancerOnboardingState = {
  user: null,
  step: FREELANCER_STEP_NAME,
  loading: false,
  skillsLoading: false,
  skillsError: '',
  availableSkills: [],
  showDraftModal: false,
  availableLocations: [],
};

export interface UseOnboardingFreelancerOptions {
  t: TranslateFn;
}

export function useOnboardingFreelancer(
  form: UseFormReturn<OnboardingFormValues>,
  options: UseOnboardingFreelancerOptions,
) {
  const { t } = options;
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [state, dispatch] = useReducer(
    freelancerOnboardingReducer,
    initialState,
  );

  const { getValues, setError, clearErrors } = form;

  useEffect(() => {
    if (state.step !== FREELANCER_STEP_SKILLS) return;
    if (state.availableSkills.length > 0) return;
    let cancelled = false;
    async function loadSkills() {
      dispatch({ type: 'SET_SKILLS_ERROR', payload: '' });
      dispatch({ type: 'SET_SKILLS_LOADING', payload: true });
      try {
        const skills = await getSkills();
        if (!cancelled)
          dispatch({ type: 'SET_AVAILABLE_SKILLS', payload: skills });
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: 'SET_SKILLS_ERROR',
            payload:
              err instanceof Error ? err.message : t('onboarding.saveFailed'),
          });
        }
      } finally {
        if (!cancelled)
          dispatch({ type: 'SET_SKILLS_LOADING', payload: false });
      }
    }
    void loadSkills();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.availableSkills.length]);

  useEffect(() => {
    if (state.step !== FREELANCER_STEP_PROFILE_FORM) return;
    if (state.availableLocations.length > 0) return;
    let cancelled = false;
    async function loadLocations() {
      try {
        const locs = await getLocations();
        if (!cancelled)
          dispatch({ type: 'SET_AVAILABLE_LOCATIONS', payload: locs });
      } catch {
        if (!cancelled)
          dispatch({ type: 'SET_AVAILABLE_LOCATIONS', payload: [] });
      }
    }
    void loadLocations();
    return () => {
      cancelled = true;
    };
  }, [state.step, state.availableLocations.length]);

  const init = useCallback((user: AuthUser, step: number) => {
    dispatch({ type: 'INIT', payload: { user, step } });
  }, []);

  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

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
      dispatch({ type: 'SET_STEP', payload: FREELANCER_STEP_PHONE });
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
      dispatch({ type: 'SET_STEP', payload: FREELANCER_STEP_COMPANY });
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
      dispatch({ type: 'SET_STEP', payload: FREELANCER_STEP_SKILLS });
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [t, clearErrors, getValues, setError, setValidationErrors]);

  const handleSkillsSubmit = useCallback(async () => {
    clearErrors();
    dispatch({ type: 'SET_LOADING', payload: true });
    const raw = getValues();
    const result = stepSkillsSchema.safeParse({
      selectedSkillIds: raw.selectedSkillIds,
    });
    if (!result.success) {
      setValidationErrors(result.error.issues);
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      const { user: updated } = await updateProfile({
        skillIds: result.data.selectedSkillIds,
      });
      updateStoredUser(updated);
      dispatch({ type: 'SET_USER', payload: updated });
      dispatch({ type: 'SET_STEP', payload: FREELANCER_STEP_DEFAULT_MESSAGE });
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [clearErrors, getValues, setError, setValidationErrors, t]);

  const handleDefaultMessageSubmit = useCallback(async () => {
    clearErrors();
    dispatch({ type: 'SET_LOADING', payload: true });
    const raw = getValues();
    const result = stepDefaultMessageSchema.safeParse({
      defaultMessage: raw.defaultMessage,
    });
    if (!result.success) {
      setValidationErrors(result.error.issues);
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      const { user: updated } = await updateProfile({
        defaultMessage: (result.data.defaultMessage ?? '').trim() || undefined,
      });
      updateStoredUser(updated);
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_STEP', payload: FREELANCER_STEP_PROFILE_QUESTION });
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [clearErrors, getValues, setError, setValidationErrors, t]);

  const handleProfileQuestionNo = useCallback(() => {
    const draft = getDraftJob();
    if (draft) openDraftModal();
    else finishOnboarding();
  }, [openDraftModal, finishOnboarding]);

  const handleProfileQuestionYes = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: FREELANCER_STEP_PROFILE_FORM });
  }, []);

  const handleProfileFormSubmit = useCallback(async () => {
    clearErrors();
    dispatch({ type: 'SET_LOADING', payload: true });
    const raw = getValues();
    const result = stepProfileFormSchema.safeParse({
      profileName: raw.profileName,
      profileEmail: raw.profileEmail,
      profileWebsite: raw.profileWebsite,
      profilePhone: raw.profilePhone,
      profileLocationId: raw.profileLocationId,
      profileAboutUs: raw.profileAboutUs,
    });
    if (!result.success) {
      const issues = result.error.issues;
      clearErrors();
      issues.forEach((issue) => {
        const path0 = issue.path[0];
        if (typeof path0 === 'string')
          setError(path0 as keyof OnboardingFormValues, {
            message: issue.message,
          });
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      await createContractorProfile({
        name: result.data.profileName.trim(),
        email: result.data.profileEmail?.trim() || undefined,
        phone: result.data.profilePhone?.trim() || undefined,
        website: result.data.profileWebsite?.trim() || undefined,
        locationId: result.data.profileLocationId?.trim() || undefined,
        aboutUs: result.data.profileAboutUs?.trim() || undefined,
      });
      const draft = getDraftJob();
      dispatch({ type: 'SET_LOADING', payload: false });
      if (draft) openDraftModal();
      else finishOnboarding();
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [clearErrors, getValues, setError, t, openDraftModal, finishOnboarding]);

  return {
    state,
    actions: {
      init,
      goToStep,
      handleNameSubmit,
      handlePhoneSubmit,
      handleCompanyFetched,
      handleCompanySubmit,
      handleSkillsSubmit,
      handleDefaultMessageSubmit,
      handleProfileQuestionNo,
      handleProfileQuestionYes,
      handleProfileFormSubmit,
      openDraftModal,
      closeDraftModal,
      finishOnboarding,
      goToNewJob,
    },
  };
}
