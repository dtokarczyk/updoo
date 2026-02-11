'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addFavorite,
  applyToJob,
  closeJob,
  createJob,
  getFavoritesJobs,
  getJob,
  getJobPrevNext,
  getJobsFeed,
  getPendingJobs,
  getUserApplications,
  getUserJobs,
  publishJob,
  rejectJob,
  removeFavorite,
  updateJob,
  type CreateJobPayload,
  type Job,
  type JobLanguage,
} from '@/lib/api';
import { useAuthQuery } from './auth';
import { queryKeys } from './keys';

export interface JobsFeedParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  language?: JobLanguage | '';
  skillIds?: string[];
}

export function useJobsFeedQuery(params: JobsFeedParams = {}) {
  const { page = 1, pageSize = 15, categoryId, language, skillIds } = params;
  return useQuery({
    queryKey: queryKeys.jobsFeed({
      page,
      pageSize,
      categoryId,
      language:
        language === 'POLISH' || language === 'ENGLISH' ? language : undefined,
      skillIds,
    }),
    queryFn: () =>
      getJobsFeed(page, pageSize, categoryId, language, skillIds),
    staleTime: 60 * 1000,
  });
}

export function useJobQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.job(id ?? ''),
    queryFn: () => getJob(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useJobPrevNextQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.jobPrevNext(id ?? ''),
    queryFn: () => getJobPrevNext(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useMyJobsQuery() {
  const { isLoggedIn } = useAuthQuery();
  return useQuery({
    queryKey: queryKeys.myJobs(),
    queryFn: getUserJobs,
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
  });
}

export function usePendingJobsQuery(page: number = 1, pageSize: number = 15) {
  const { isLoggedIn } = useAuthQuery();
  return useQuery({
    queryKey: queryKeys.pendingJobs({ page, pageSize }),
    queryFn: () => getPendingJobs(page, pageSize),
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
  });
}

export function useFavoritesQuery() {
  const { isLoggedIn } = useAuthQuery();
  return useQuery({
    queryKey: queryKeys.favorites(),
    queryFn: getFavoritesJobs,
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
  });
}

export function useMyApplicationsQuery() {
  const { isLoggedIn } = useAuthQuery();
  return useQuery({
    queryKey: queryKeys.myApplications(),
    queryFn: getUserApplications,
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
  });
}

export function usePublishJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => publishJob(jobId),
    onSuccess: (job: Job) => {
      queryClient.setQueryData(queryKeys.job(job.id), job);
      queryClient.invalidateQueries({ queryKey: ['jobs', 'my-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'pending'] });
    },
  });
}

export function useRejectJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, reason }: { jobId: string; reason: string }) =>
      rejectJob(jobId, reason),
    onSuccess: (job: Job) => {
      queryClient.setQueryData(queryKeys.job(job.id), job);
      queryClient.invalidateQueries({ queryKey: ['jobs', 'my-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'pending'] });
    },
  });
}

export function useCloseJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => closeJob(jobId),
    onSuccess: (job: Job) => {
      queryClient.setQueryData(queryKeys.job(job.id), job);
      queryClient.invalidateQueries({ queryKey: ['jobs', 'my-jobs'] });
    },
  });
}

export function useCreateJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJobPayload) => createJob(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'my-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'feed'] });
    },
  });
}

export function useUpdateJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateJobPayload }) =>
      updateJob(id, payload),
    onSuccess: (job: Job) => {
      queryClient.setQueryData(queryKeys.job(job.id), job);
      queryClient.invalidateQueries({ queryKey: ['jobs', 'my-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'feed'] });
    },
  });
}

export function useApplyToJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, message }: { jobId: string; message?: string }) =>
      applyToJob(jobId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.job(variables.jobId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.myApplications() });
    },
  });
}

export function useAddFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => addFavorite(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.job(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites() });
    },
  });
}

export function useRemoveFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => removeFavorite(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.job(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites() });
    },
  });
}
