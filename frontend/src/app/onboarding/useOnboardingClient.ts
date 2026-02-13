'use client';

import { useCallback, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { TranslateFn } from './schemas';

export const CLIENT_STEP_NAME = 0;
export const CLIENT_STEP_PHONE = 1;
export const CLIENT_STEP_COMPANY = 2;

interface ClientOnboardingState {
  user: AuthUser | null;
  step: number;
  showDraftModal: boolean;
}

type ClientOnboardingAction =
  | { type: 'INIT'; payload: { user: AuthUser; step: number } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_USER'; payload: AuthUser }
  | { type: 'SET_SHOW_DRAFT_MODAL'; payload: boolean };

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
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SHOW_DRAFT_MODAL':
      return { ...state, showDraftModal: action.payload };
    default:
      return state;
  }
}

const initialState: ClientOnboardingState = {
  user: null,
  step: CLIENT_STEP_NAME,
  showDraftModal: false,
};

export interface UseOnboardingClientOptions {
  t: TranslateFn;
}

export function useOnboardingClient(options: UseOnboardingClientOptions) {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [state, dispatch] = useReducer(clientOnboardingReducer, initialState);

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
