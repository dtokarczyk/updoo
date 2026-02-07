/**
 * Server-side job fetching. Re-exports from api.ts so job detail page uses shared API layer.
 */
import {
  getJobServer as fetchJobServer,
  getJobPrevNextServer as fetchJobPrevNextServer,
} from '@/lib/api';

export { fetchJobServer, fetchJobPrevNextServer };
