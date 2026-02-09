import { z } from 'zod';

export type PasswordFormValues = {
  oldPassword: string;
  password: string;
  passwordConfirm: string;
};

export const defaultPasswordFormValues: PasswordFormValues = {
  oldPassword: '',
  password: '',
  passwordConfirm: '',
};

const PASSWORD_MIN_LENGTH = 6;

/**
 * Returns Zod schema with translated validation messages.
 * Use with useTranslations: getPasswordFormSchema(t, hasPassword)
 */
export function getPasswordFormSchema(
  t: (key: string) => string,
  hasPassword: boolean
) {
  return z
    .object({
      oldPassword: hasPassword
        ? z
          .string()
          .min(1, t('profile.validation.oldPasswordRequired'))
        : z.string(),
      password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, t('profile.validation.passwordMin')),
      passwordConfirm: z
        .string()
        .min(PASSWORD_MIN_LENGTH, t('profile.validation.passwordMin')),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: t('profile.passwordMismatch'),
      path: ['passwordConfirm'],
    }) satisfies z.ZodType<PasswordFormValues>;
}
