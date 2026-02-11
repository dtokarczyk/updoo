'use client';

/**
 * Auth state and provider come from React Query layer (api-query).
 * This file re-exports for backward compatibility – use @/lib/api-query in new code.
 */
export {
  ApiQueryProvider as AuthProvider,
  useAuth,
  useOnAuthSuccess,
  queryKeys,
} from '@/lib/api-query';
export type { UseAuthReturn } from '@/lib/api-query';
