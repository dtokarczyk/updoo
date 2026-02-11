'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  acceptAgreements,
  clearAuth,
  getProfile,
  getStoredUser,
  getToken,
  removeAvatar,
  setAuth,
  updateProfile,
  updateStoredUser,
  uploadAvatar,
  type AuthResponse,
  type AuthUser,
  type ProfileResponse,
  type UpdateProfilePayload,
} from '@/lib/api';
import { queryKeys } from './keys';

async function fetchAuthProfile(): Promise<ProfileResponse | null> {
  const token = getToken();
  if (!token) return null;
  const res = await getProfile();
  if (res?.user) updateStoredUser(res.user);
  return res;
}

function getInitialAuthProfile(): ProfileResponse | null {
  if (typeof window === 'undefined') return null;
  const user = getStoredUser();
  if (!user) return null;
  return { user, needsAgreementsAcceptance: false };
}

export interface UseAuthQueryReturn {
  user: AuthUser | null;
  isLoggedIn: boolean;
  /** Key that changes on each refetch – use as cache buster for avatar URL. */
  userKey: number;
  /** Refetch user from API and update cache (e.g. after login/register/avatar change). */
  refreshAuth: () => Promise<void>;
  /** Clear storage and invalidate auth query. */
  logout: () => void;
  /** Raw profile response (user + needsAgreementsAcceptance). */
  profile: ProfileResponse | null | undefined;
  isProfileLoading: boolean;
  isProfileError: boolean;
}

export function useAuthQuery(): UseAuthQueryReturn {
  const queryClient = useQueryClient();
  const { data, dataUpdatedAt, refetch, isPending, isError } = useQuery({
    queryKey: queryKeys.authProfile(),
    queryFn: fetchAuthProfile,
    initialData: getInitialAuthProfile,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const refreshAuth = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const logout = useCallback(() => {
    clearAuth();
    queryClient.setQueryData(queryKeys.authProfile(), null);
  }, [queryClient]);

  const user = data?.user ?? null;
  const isLoggedIn = !!user;
  const userKey = dataUpdatedAt;

  return {
    user,
    isLoggedIn,
    userKey,
    refreshAuth,
    logout,
    profile: data,
    isProfileLoading: isPending,
    isProfileError: isError,
  };
}

/** Call after login/register/OAuth to persist auth and refresh profile query. */
export function useOnAuthSuccess() {
  const queryClient = useQueryClient();
  return useCallback(
    (response: AuthResponse) => {
      setAuth(response);
      queryClient.invalidateQueries({ queryKey: queryKeys.authProfile() });
    },
    [queryClient],
  );
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.authProfile(),
        (prev: ProfileResponse | null) =>
          prev ? { ...prev, user: data.user } : null,
      );
    },
  });
}

export function useRemoveAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.authProfile(),
        (prev: ProfileResponse | null) =>
          prev ? { ...prev, user: data.user } : null,
      );
    },
  });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.authProfile(),
        (prev: ProfileResponse | null) =>
          prev ? { ...prev, user: data.user } : null,
      );
    },
  });
}

export function useAcceptAgreementsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptAgreements,
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.authProfile(),
        (prev: ProfileResponse | null) =>
          prev ? { ...prev, user: data.user } : null,
      );
    },
  });
}
