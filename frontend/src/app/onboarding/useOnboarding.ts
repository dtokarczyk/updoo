'use client';

import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  updateProfile,
  updateStoredUser,
  needsOnboarding,
  getSkills,
  getDraftJob,
  createContractorProfile,
  getLocations,
  type AccountType,
  type Skill,
  type AuthUser,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { TranslateFn } from './schemas';
import {
  type OnboardingFormValues,
  stepPhoneSchema,
  stepNameSchema,
  stepAccountTypeSchema,
  stepCompanySchema,
  stepSkillsSchema,
  stepDefaultMessageSchema,
  stepProfileFormSchema,
} from './schemas';

export const STEP_NAME = 0;
export const STEP_PHONE = 1;
export const STEP_ACCOUNT_TYPE = 2;
export const STEP_COMPANY = 3;
export const STEP_SKILLS = 4;
export const STEP_DEFAULT_MESSAGE = 5;
export const STEP_PROFILE_QUESTION = 6;
export const STEP_PROFILE_FORM = 7;

export interface OnboardingState {
  user: AuthUser | null;
  step: number;
  loading: boolean;
  skillsLoading: boolean;
  skillsError: string;
  availableSkills: Skill[];
  skillsSearch: string;
  showDraftModal: boolean;
  availableLocations: { id: string; name: string; slug: string }[];
}

type OnboardingAction =
  | { type: 'INIT'; payload: { user: AuthUser; step: number } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SKILLS_LOADING'; payload: boolean }
  | { type: 'SET_SKILLS_ERROR'; payload: string }
  | { type: 'SET_AVAILABLE_SKILLS'; payload: Skill[] }
  | { type: 'SET_SKILLS_SEARCH'; payload: string }
  | { type: 'SET_SHOW_DRAFT_MODAL'; payload: boolean }
  | { type: 'SET_USER'; payload: AuthUser }
  | { type: 'SET_AVAILABLE_LOCATIONS'; payload: { id: string; name: string; slug: string }[] };

function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction,
): OnboardingState {
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
    case 'SET_SKILLS_SEARCH':
      return { ...state, skillsSearch: action.payload };
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

const initialState: OnboardingState = {
  user: null,
  step: STEP_NAME,
  loading: false,
  skillsLoading: false,
  skillsError: '',
  availableSkills: [],
  skillsSearch: '',
  showDraftModal: false,
  availableLocations: [],
};

export interface UseOnboardingOptions {
  t: TranslateFn;
}

export function useOnboarding(
  form: UseFormReturn<OnboardingFormValues>,
  options: UseOnboardingOptions,
) {
  const { t } = options;
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  const { watch, setValue, getValues, setError, clearErrors } = form;
  const accountType = watch('accountType');

  useEffect(() => {
    if (state.step !== STEP_SKILLS || accountType !== 'FREELANCER') return;
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
    // t omitted: used only for error message fallback; including it causes infinite loop (new ref every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t causes infinite re-runs
  }, [state.step, state.availableSkills.length, accountType]);

  useEffect(() => {
    if (state.step !== STEP_PROFILE_FORM) return;
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

  const filteredSkills = useMemo(
    () =>
      state.skillsSearch.trim().length === 0
        ? state.availableSkills
        : state.availableSkills.filter((skill) =>
          skill.name
            .toLowerCase()
            .includes(state.skillsSearch.trim().toLowerCase()),
        ),
    [state.availableSkills, state.skillsSearch],
  );

  const init = useCallback((user: AuthUser, step: number) => {
    dispatch({ type: 'INIT', payload: { user, step } });
  }, []);

  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const setSkillsSearch = useCallback((value: string) => {
    dispatch({ type: 'SET_SKILLS_SEARCH', payload: value });
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
      dispatch({ type: 'SET_STEP', payload: STEP_PHONE });
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
      dispatch({ type: 'SET_STEP', payload: STEP_ACCOUNT_TYPE });
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [clearErrors, getValues, setError, setValidationErrors, t]);

  const handleAccountTypeSubmit = useCallback(async () => {
    clearErrors();
    dispatch({ type: 'SET_LOADING', payload: true });
    const raw = getValues();
    const result = stepAccountTypeSchema(t).safeParse({
      accountType: raw.accountType,
    });
    if (!result.success) {
      setValidationErrors(result.error.issues);
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      const { user: updated } = await updateProfile({
        accountType: result.data.accountType as AccountType,
      });
      updateStoredUser(updated);
      dispatch({ type: 'SET_USER', payload: updated });
      dispatch({ type: 'SET_STEP', payload: STEP_COMPANY });
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [t, clearErrors, getValues, setError, setValidationErrors]);

  const handleCompanySubmit = useCallback(async () => {
    clearErrors();
    dispatch({ type: 'SET_LOADING', payload: true });
    const raw = getValues();
    const result = stepCompanySchema(t).safeParse({
      hasCompany: raw.hasCompany,
      nipCompany: raw.nipCompany,
    });
    if (!result.success) {
      setValidationErrors(result.error.issues);
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      // Company is linked via companyId in profile edit; NIP is stored in Company table.
      const { user: updated } = await updateProfile({});
      updateStoredUser(updated);
      dispatch({ type: 'SET_USER', payload: updated });
      if (accountType === 'FREELANCER') {
        dispatch({ type: 'SET_STEP', payload: STEP_SKILLS });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_STEP', payload: STEP_PROFILE_QUESTION });
      }
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [
    t,
    accountType,
    clearErrors,
    getValues,
    setError,
    setValidationErrors,
    openDraftModal,
    finishOnboarding,
  ]);

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
      dispatch({ type: 'SET_STEP', payload: STEP_DEFAULT_MESSAGE });
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
      dispatch({ type: 'SET_USER', payload: updated });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_STEP', payload: STEP_PROFILE_QUESTION });
    } catch (err) {
      setError('root', {
        message:
          err instanceof Error ? err.message : t('onboarding.saveFailed'),
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [
    clearErrors,
    getValues,
    setError,
    setValidationErrors,
    t,
  ]);

  const handleProfileQuestionNo = useCallback(() => {
    const draft = getDraftJob();
    if (draft) openDraftModal();
    else finishOnboarding();
  }, [openDraftModal, finishOnboarding]);

  const handleProfileQuestionYes = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: STEP_PROFILE_FORM });
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
          setError(path0 as keyof OnboardingFormValues, { message: issue.message });
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
  }, [
    clearErrors,
    getValues,
    setError,
    t,
    openDraftModal,
    finishOnboarding,
  ]);

  const toggleSkill = useCallback(
    (id: string) => {
      const current = getValues('selectedSkillIds');
      setValue(
        'selectedSkillIds',
        current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id],
      );
    },
    [getValues, setValue],
  );

  return {
    state,
    accountType,
    filteredSkills,
    actions: {
      init,
      goToStep,
      setSkillsSearch,
      setValidationErrors,
      handleNameSubmit,
      handlePhoneSubmit,
      handleAccountTypeSubmit,
      handleCompanySubmit,
      handleSkillsSubmit,
      handleDefaultMessageSubmit,
      handleProfileQuestionNo,
      handleProfileQuestionYes,
      handleProfileFormSubmit,
      toggleSkill,
      openDraftModal,
      closeDraftModal,
      finishOnboarding,
      goToNewJob,
    },
    needsOnboarding,
  };
}
