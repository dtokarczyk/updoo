'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationPreferences,
  updateNotificationPreference,
  type NotificationFrequency,
  type NotificationType,
} from '@/lib/api';
import { useAuthQuery } from './auth';
import { queryKeys } from './keys';

export function useNotificationPreferencesQuery() {
  const { isLoggedIn } = useAuthQuery();
  return useQuery({
    queryKey: queryKeys.notificationPreferences(),
    queryFn: getNotificationPreferences,
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
  });
}

export function useUpdateNotificationPreferenceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      type,
      data,
    }: {
      type: NotificationType;
      data: { enabled?: boolean; frequency?: NotificationFrequency };
    }) => updateNotificationPreference(type, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationPreferences(),
      });
    },
  });
}
