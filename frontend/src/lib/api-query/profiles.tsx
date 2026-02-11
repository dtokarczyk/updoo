'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContractorProfile,
  deleteContractorProfile,
  getMyProfiles,
  getProfileBySlug,
  removeProfileCover,
  updateContractorProfile,
  uploadProfileCover,
  type CreateProfilePayload,
  type Profile,
} from '@/lib/api';
import { useAuthQuery } from './auth';
import { queryKeys } from './keys';

export function useProfileBySlugQuery(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profileBySlug(slug ?? ''),
    queryFn: () => getProfileBySlug(slug!),
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
}

export function useMyProfilesQuery() {
  const { isLoggedIn } = useAuthQuery();
  return useQuery({
    queryKey: queryKeys.myProfiles(),
    queryFn: getMyProfiles,
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
  });
}

export function useCreateContractorProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProfilePayload) => createContractorProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myProfiles() });
    },
  });
}

export function useUpdateContractorProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: { id: string; data: Partial<CreateProfilePayload> }) =>
      updateContractorProfile(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myProfiles() });
      queryClient.setQueryData(
        queryKeys.profileBySlug(updated.slug),
        updated,
      );
    },
  });
}

export function useDeleteContractorProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContractorProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myProfiles() });
    },
  });
}

export function useUploadProfileCoverMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, file }: { profileId: string; file: Blob }) =>
      uploadProfileCover(profileId, file),
    onSuccess: (updated: Profile) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myProfiles() });
      queryClient.setQueryData(
        queryKeys.profileBySlug(updated.slug),
        updated,
      );
    },
  });
}

export function useRemoveProfileCoverMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => removeProfileCover(profileId),
    onSuccess: (updated: Profile) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myProfiles() });
      queryClient.setQueryData(
        queryKeys.profileBySlug(updated.slug),
        updated,
      );
    },
  });
}
