import {
  BillingType,
  ExperienceLevel,
  HoursPerWeek,
  ProjectType,
} from '@prisma/client';

/** Allowed values for AI-generated job metadata (used for validation and random selection). */
export const ALLOWED = {
  billingType: Object.values(BillingType),
  experienceLevel: Object.values(ExperienceLevel),
  projectType: Object.values(ProjectType),
  offerDays: [7, 14, 21, 30] as const,
  hoursPerWeek: Object.values(HoursPerWeek),
  expectedOffers: [6, 10, 14] as const,
  expectedApplicantTypes: [
    'FREELANCER_NO_B2B',
    'FREELANCER_B2B',
    'COMPANY',
  ] as const,
} as const;

/** Max number of AI-generated job posts to add per day. */
export const MAX_POSTS_PER_DAY =
  parseInt(process.env.CONTENT_GENERATOR_MAX_POSTS_PER_DAY ?? '5', 10) || 5;

/** Hour range for posting (inclusive). Posts only between 6:00 and 23:59. */
export const HOUR_START = 6;
export const HOUR_END = 23;
