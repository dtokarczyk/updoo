import { z } from 'zod';

export type BusinessProfileFormValues = {
  name: string;
  email: string;
  website: string;
  phone: string;
  locationId: string;
  aboutUs: string;
};

export const defaultBusinessProfileFormValues: BusinessProfileFormValues = {
  name: '',
  email: '',
  website: '',
  phone: '',
  locationId: '',
  aboutUs: '',
};

/** Returns Zod schema with translated validation messages. Use with useTranslations: getBusinessProfileFormSchema(t) */
export function getBusinessProfileFormSchema(t: (key: string) => string) {
  return z.object({
    name: z
      .string()
      .min(2, t('profile.validation.profileNameMin'))
      .max(200, t('profile.validation.profileNameMax')),
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
      .max(2000, t('profile.validation.aboutUsMax'))
      .optional()
      .default(''),
  }) satisfies z.ZodType<BusinessProfileFormValues>;
}
