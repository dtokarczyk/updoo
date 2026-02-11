/**
 * React Query layer for API – query hooks end with Query, mutation hooks with Mutation.
 * Re-export useAuthQuery as useAuth for backward compatibility.
 */

export { queryKeys } from './keys';
export { ApiQueryProvider } from './provider';

export {
  useAuthQuery,
  useOnAuthSuccess,
  useUpdateProfileMutation,
  useRemoveAvatarMutation,
  useUploadAvatarMutation,
  useAcceptAgreementsMutation,
  type UseAuthQueryReturn,
} from './auth';

/** @deprecated Use useAuthQuery. Kept for backward compatibility (AuthContext, layout). */
export { useAuthQuery as useAuth } from './auth';

/** @deprecated Use UseAuthQueryReturn. Kept for backward compatibility. */
export type { UseAuthQueryReturn as UseAuthReturn } from './auth';

export {
  useTermsContentQuery,
  usePrivacyPolicyContentQuery,
} from './agreements';

export {
  useCategoriesQuery,
  useLocationsQuery,
  useSkillsQuery,
  usePopularSkillsForCategoryQuery,
} from './categories';

export {
  useJobsFeedQuery,
  useJobQuery,
  useJobPrevNextQuery,
  useMyJobsQuery,
  usePendingJobsQuery,
  useFavoritesQuery,
  useMyApplicationsQuery,
  usePublishJobMutation,
  useRejectJobMutation,
  useCloseJobMutation,
  useCreateJobMutation,
  useUpdateJobMutation,
  useApplyToJobMutation,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  type JobsFeedParams,
} from './jobs';

export {
  useProfileBySlugQuery,
  useMyProfilesQuery,
  useCreateContractorProfileMutation,
  useUpdateContractorProfileMutation,
  useDeleteContractorProfileMutation,
  useUploadProfileCoverMutation,
  useRemoveProfileCoverMutation,
} from './profiles';

export {
  useMyCompanyQuery,
  useLinkCompanyByNipMutation,
  useRefreshCompanyMutation,
} from './company';

export {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferenceMutation,
} from './notifications';
