/** Single source of cache keys for React Query. */

export const queryKeys = {
  /** Current user profile (user + needsAgreementsAcceptance). Null when not logged in. */
  authProfile: () => ['auth', 'profile'] as const,
  categories: () => ['jobs', 'categories'] as const,
  locations: () => ['jobs', 'locations'] as const,
  skills: () => ['jobs', 'skills'] as const,
  job: (id: string) => ['jobs', 'detail', id] as const,
  jobPrevNext: (id: string) => ['jobs', 'prev-next', id] as const,
  jobsFeed: (params: {
    page: number;
    pageSize: number;
    categoryId?: string;
    skillIds?: string[];
  }) => ['jobs', 'feed', params] as const,
  profileBySlug: (slug: string) => ['profiles', 'slug', slug] as const,
  myProfiles: () => ['profiles', 'my'] as const,
  myCompany: () => ['auth', 'company'] as const,
  myApplications: () => ['jobs', 'my-applications'] as const,
  myJobs: () => ['jobs', 'my-jobs'] as const,
  favorites: () => ['jobs', 'favorites'] as const,
  pendingJobs: (params: { page: number; pageSize: number }) =>
    ['jobs', 'pending', params] as const,
  notificationPreferences: () => ['notifications', 'preferences'] as const,
  popularSkills: (categoryId: string) =>
    ['jobs', 'popular-skills', categoryId] as const,
  termsContent: () => ['agreements', 'terms'] as const,
  privacyPolicyContent: () => ['agreements', 'privacy-policy'] as const,
} as const;
