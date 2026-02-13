import { z } from 'zod';

export type BusinessProfileFormValues = {
  name: string;
  slug: string;
  email: string;
  website: string;
  phone: string;
  locationId: string;
  aboutUs: string;
};

export const defaultBusinessProfileFormValues: BusinessProfileFormValues = {
  name: '',
  slug: '',
  email: '',
  website: '',
  phone: '',
  locationId: '',
  aboutUs: '',
};

/** Slug format: lowercase letters, numbers, hyphens only. */
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Returns Zod schema with translated validation messages. Use with useTranslations: getBusinessProfileFormSchema(t) */
export function getBusinessProfileFormSchema(t: (key: string) => string) {
  return z.object({
    name: z
      .string()
      .min(2, t('profile.validation.profileNameMin'))
      .max(200, t('profile.validation.profileNameMax')),
    slug: z
      .string()
      .min(2, t('profile.validation.slugMin'))
      .max(100, t('profile.validation.slugMax'))
      .regex(slugRegex, t('profile.validation.slugInvalid'))
      .default(''),
    email: z
      .string()
      .optional()
      .refine(
        (v) => !v || v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        t('profile.validation.emailInvalid'),
      )
      .transform((v) => v ?? ''),
    website: z
      .string()
      .optional()
      .refine(
        (v) => !v || v === '' || /^https?:\/\/.+/.test(v),
        t('profile.validation.websiteInvalid'),
      )
      .transform((v) => v ?? ''),
    phone: z
      .string()
      .max(30, t('profile.validation.phoneMax'))
      .optional()
      .default(''),
    locationId: z.string().optional().default(''),
    aboutUs: z
      .string()
      .min(1, t('profile.validation.aboutUsRequired'))
      .max(2000, t('profile.validation.aboutUsMax'))
      .default(''),
  }) satisfies z.ZodType<BusinessProfileFormValues>;
}
