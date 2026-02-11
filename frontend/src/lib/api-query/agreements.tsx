'use client';

import { useQuery } from '@tanstack/react-query';
import { getPrivacyPolicyContent, getTermsContent } from '@/lib/api';
import { queryKeys } from './keys';

export function useTermsContentQuery() {
  return useQuery({
    queryKey: queryKeys.termsContent(),
    queryFn: getTermsContent,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePrivacyPolicyContentQuery() {
  return useQuery({
    queryKey: queryKeys.privacyPolicyContent(),
    queryFn: getPrivacyPolicyContent,
    staleTime: 5 * 60 * 1000,
  });
}
