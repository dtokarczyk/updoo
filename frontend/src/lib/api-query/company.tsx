'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyCompany,
  linkCompanyByNip,
  refreshCompany,
  unlinkCompany,
  updateCompany,
  updateStoredUser,
} from '@/lib/api';
import { useAuthQuery } from './auth';
import { queryKeys } from './keys';

export function useMyCompanyQuery() {
  const { isLoggedIn } = useAuthQuery();
  return useQuery({
    queryKey: queryKeys.myCompany(),
    queryFn: () => getMyCompany().then((r) => r.company),
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
  });
}

export function useLinkCompanyByNipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      nip,
      companySize,
    }: {
      nip: string;
      companySize?: string | null;
    }) => linkCompanyByNip(nip, companySize),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.authProfile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myCompany() });
    },
  });
}

export function useUpdateCompanyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { companySize?: string | null }) =>
      updateCompany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.authProfile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myCompany() });
    },
  });
}

export function useRefreshCompanyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myCompany() });
    },
  });
}

export function useUnlinkCompanyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unlinkCompany,
    onSuccess: (data) => {
      if (data?.user) updateStoredUser(data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.authProfile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myCompany() });
    },
  });
}
