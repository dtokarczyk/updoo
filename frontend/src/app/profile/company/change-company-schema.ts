import { z } from 'zod';

export type ChangeCompanyFormValues = {
  nip: string;
};

export const defaultChangeCompanyFormValues: ChangeCompanyFormValues = {
  nip: '',
};

/** Returns Zod schema with translated validation. Use with useTranslations: getChangeCompanyFormSchema(t) */
export function getChangeCompanyFormSchema(t: (key: string) => string) {
  return z.object({
    nip: z
      .string()
      .refine(
        (val) =>
          /^\d{10}$/.test(val.trim().replace(/\s/g, '').replace(/-/g, '')),
        { message: t('profile.companyNipInvalid') },
      ),
  }) satisfies z.ZodType<ChangeCompanyFormValues>;
}
