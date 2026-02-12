import { BillingType, ExperienceLevel, ProjectType } from '@prisma/client';

/** Allowed values for AI-generated job metadata (used for validation and random offerDays). */
export const ALLOWED = {
  billingType: Object.values(BillingType),
  experienceLevel: Object.values(ExperienceLevel),
  projectType: Object.values(ProjectType),
  offerDays: [7, 14, 21, 30] as const,
} as const;

/** Max number of AI-generated job posts to add per day. */
export const MAX_POSTS_PER_DAY =
  parseInt(process.env.CONTENT_GENERATOR_MAX_POSTS_PER_DAY ?? '5', 10) || 5;

/** Hour range for posting (inclusive). Posts only between 6:00 and 23:59. */
export const HOUR_START = 6;
export const HOUR_END = 23;
