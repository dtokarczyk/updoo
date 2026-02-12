import { z } from 'zod';

/** Translation key used as error message (display with t(message)). */
const msg = (key: string) => key;

const jobLanguageEnum = z.enum(['POLISH', 'ENGLISH']);
const billingTypeEnum = z.enum(['FIXED', 'HOURLY']);
const hoursPerWeekEnum = z.enum([
  'LESS_THAN_10',
  'FROM_11_TO_20',
  'FROM_21_TO_30',
  'MORE_THAN_30',
]);
const experienceLevelEnum = z.enum(['JUNIOR', 'MID', 'SENIOR']);
const projectTypeEnum = z.enum(['ONE_TIME', 'CONTINUOUS']);
const expectedApplicantTypeEnum = z.enum([
  'FREELANCER_NO_B2B',
  'FREELANCER_B2B',
  'COMPANY',
]);

const selectedSkillSchema = z.object({
  /** Skill ID from DB, or null for new (tag) skills. Avoids clash with useFieldArray's `id`. */
  skillId: z.string().nullable(),
  name: z.string(),
});

export const jobFormSchema = z
  .object({
    title: z.string().min(1, msg('jobs.fillRequired')).max(200),
    description: z.string().min(1, msg('jobs.fillRequired')).max(5000),
    categoryId: z.string().min(1, msg('jobs.fillRequired')),
    language: jobLanguageEnum,
    billingType: z.union([billingTypeEnum, z.literal('')]),
    hoursPerWeek: z.union([hoursPerWeekEnum, z.literal('')]),
    rate: z.string(),
    rateNegotiable: z.boolean(),
    currency: z.string().min(3).max(3),
    experienceLevel: z.union([experienceLevelEnum, z.literal('')]),
    locationId: z.string(),
    isRemote: z.boolean(),
    projectType: z.union([projectTypeEnum, z.literal('')]),
    offerDays: z.union([
      z.literal(7),
      z.literal(14),
      z.literal(21),
      z.literal(30),
      z.literal(''),
    ]),
    expectedOffers: z.union([
      z.literal(6),
      z.literal(10),
      z.literal(14),
      z.literal(''),
    ]),
    expectedApplicantType: z.union([
      expectedApplicantTypeEnum,
      z.literal(''),
    ]),
    selectedSkills: z.array(selectedSkillSchema).max(5),
  })
  .superRefine((data, ctx) => {
    if (data.billingType === '') {
      ctx.addIssue({
        path: ['billingType'],
        message: msg('jobs.newJobForm.selectBillingType'),
        code: z.ZodIssueCode.custom,
      });
    }
    if (data.experienceLevel === '') {
      ctx.addIssue({
        path: ['experienceLevel'],
        message: msg('jobs.newJobForm.selectExperienceLevel'),
        code: z.ZodIssueCode.custom,
      });
    }
    if (data.projectType === '') {
      ctx.addIssue({
        path: ['projectType'],
        message: msg('jobs.newJobForm.selectProjectType'),
        code: z.ZodIssueCode.custom,
      });
    }
    if (data.billingType === 'HOURLY' && data.hoursPerWeek === '') {
      ctx.addIssue({
        path: ['hoursPerWeek'],
        message: msg('jobs.selectHoursPerWeek'),
        code: z.ZodIssueCode.custom,
      });
    }
    const rateNum = parseFloat(data.rate.replace(',', '.'));
    if (
      data.rate.trim() !== '' &&
      (Number.isNaN(rateNum) || rateNum < 0)
    ) {
      ctx.addIssue({
        path: ['rate'],
        message: msg('jobs.invalidRate'),
        code: z.ZodIssueCode.custom,
      });
    }
    if (data.offerDays === '' || ![7, 14, 21, 30].includes(Number(data.offerDays))) {
      ctx.addIssue({
        path: ['offerDays'],
        message: msg('jobs.invalidOfferDays'),
        code: z.ZodIssueCode.custom,
      });
    }
    if (
      data.expectedOffers === '' ||
      ![6, 10, 14].includes(Number(data.expectedOffers))
    ) {
      ctx.addIssue({
        path: ['expectedOffers'],
        message: msg('jobs.invalidExpectedOffers'),
        code: z.ZodIssueCode.custom,
      });
    }
    if (
      data.expectedApplicantType === '' ||
      !['FREELANCER_NO_B2B', 'FREELANCER_B2B', 'COMPANY'].includes(
        data.expectedApplicantType,
      )
    ) {
      ctx.addIssue({
        path: ['expectedApplicantType'],
        message: msg('jobs.newJobForm.selectExpectedApplicantType'),
        code: z.ZodIssueCode.custom,
      });
    }
  });

export type JobFormValues = z.infer<typeof jobFormSchema>;

export type SelectedSkill = { skillId: string | null; name: string };

export const defaultJobFormValues: JobFormValues = {
  title: '',
  description: '',
  categoryId: '',
  language: 'POLISH',
  billingType: '',
  hoursPerWeek: '',
  rate: '',
  rateNegotiable: false,
  currency: 'PLN',
  experienceLevel: '',
  locationId: '',
  isRemote: true,
  projectType: '',
  offerDays: 14,
  expectedOffers: 10,
  expectedApplicantType: '',
  selectedSkills: [],
};
