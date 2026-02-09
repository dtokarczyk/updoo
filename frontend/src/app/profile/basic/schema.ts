import { z } from 'zod';

export type BasicProfileFormValues = {
  name: string;
  surname: string;
  email: string;
  phone: string;
  defaultMessage: string;
};

export const defaultBasicProfileFormValues: BasicProfileFormValues = {
  name: '',
  surname: '',
  email: '',
  phone: '',
  defaultMessage: '',
};

/** Returns Zod schema with translated validation messages. Use with useTranslations: getBasicProfileFormSchema(t) */
export function getBasicProfileFormSchema(t: (key: string) => string) {
  return z.object({
    name: z
      .string()
      .min(1, t('profile.validation.nameRequired'))
      .max(200, t('profile.validation.nameMax')),
    surname: z
      .string()
      .min(1, t('profile.validation.surnameRequired'))
      .max(200, t('profile.validation.surnameMax')),
    email: z
      .string()
      .min(1, t('profile.validation.emailRequired'))
      .email(t('profile.validation.emailInvalid')),
    phone: z.string().max(30, t('profile.validation.phoneMax')),
    defaultMessage: z.string().max(2000, t('profile.validation.messageMax')),
  }) satisfies z.ZodType<BasicProfileFormValues>;
}
