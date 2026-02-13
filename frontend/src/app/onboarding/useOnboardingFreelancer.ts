'use client';

import { useCallback, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { TranslateFn } from './schemas';

export const FREELANCER_STEP_NAME = 0;
export const FREELANCER_STEP_PHONE = 1;
export const FREELANCER_STEP_COMPANY = 2;
export const FREELANCER_STEP_SKILLS = 3;
export const FREELANCER_STEP_DEFAULT_MESSAGE = 4;
export const FREELANCER_STEP_CATEGORIES = 5;
export const FREELANCER_STEP_PROFILE_QUESTION = 6;
export const FREELANCER_STEP_PROFILE_FORM = 7;

export interface FreelancerOnboardingState {
  user: AuthUser | null;
  step: number;
  showDraftModal: boolean;
}

type FreelancerOnboardingAction =
  | { type: 'INIT'; payload: { user: AuthUser; step: number } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_USER'; payload: AuthUser }
  | { type: 'SET_SHOW_DRAFT_MODAL'; payload: boolean };

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
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SHOW_DRAFT_MODAL':
      return { ...state, showDraftModal: action.payload };
    default:
      return state;
  }
}

const initialState: FreelancerOnboardingState = {
  user: null,
  step: FREELANCER_STEP_NAME,
  showDraftModal: false,
};

export interface UseOnboardingFreelancerOptions {
  t: TranslateFn;
}

export function useOnboardingFreelancer(options: UseOnboardingFreelancerOptions) {
  const { t: _t } = options;
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [state, dispatch] = useReducer(
    freelancerOnboardingReducer,
    initialState,
  );

  const init = useCallback((user: AuthUser, step: number) => {
    dispatch({ type: 'INIT', payload: { user, step } });
  }, []);

  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const setUser = useCallback((user: AuthUser) => {
    dispatch({ type: 'SET_USER', payload: user });
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

  return {
    state,
    actions: {
      init,
      goToStep,
      setUser,
      openDraftModal,
      closeDraftModal,
      finishOnboarding,
      goToNewJob,
    },
  };
}
