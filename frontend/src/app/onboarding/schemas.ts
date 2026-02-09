import { z } from 'zod';

export type TranslateFn = (key: string) => string;

/** Form values for the whole onboarding flow */
export interface OnboardingFormValues {
  phone: string;
  name: string;
  surname: string;
  accountType: '' | 'CLIENT' | 'FREELANCER';
  hasCompany: boolean | null;
  nipCompany: string;
  selectedSkillIds: string[];
  defaultMessage: string;
  /** Optional: whether user wants to create a contractor profile */
  wantsProfile: boolean | null;
  profileName: string;
  profileEmail: string;
  profileWebsite: string;
  profilePhone: string;
  profileLocationId: string;
  profileAboutUs: string;
}

export const defaultOnboardingValues: OnboardingFormValues = {
  phone: '',
  name: '',
  surname: '',
  accountType: '',
  hasCompany: null,
  nipCompany: '',
  selectedSkillIds: [],
  defaultMessage: '',
  wantsProfile: null,
  profileName: '',
  profileEmail: '',
  profileWebsite: '',
  profilePhone: '',
  profileLocationId: '',
  profileAboutUs: '',
};

/** Step 0: phone (optional) */
export const stepPhoneSchema = z.object({
  phone: z.string().optional(),
});

/** Step 1: name and surname required */
export function stepNameSchema(t: TranslateFn) {
  const required = t('onboarding.nameSurnameRequired');
  return z.object({
    name: z
      .string()
      .min(1, required)
      .refine((s) => s.trim().length > 0, required),
    surname: z
      .string()
      .min(1, required)
      .refine((s) => s.trim().length > 0, required),
  });
}

/** Step 2: account type required */
export function stepAccountTypeSchema(t: TranslateFn) {
  return z.object({
    accountType: z.enum(['CLIENT', 'FREELANCER'], {
      error: t('onboarding.accountTypeRequired'),
    }),
  });
}

/** Step 3: hasCompany required; nipCompany required when hasCompany is true */
export function stepCompanySchema(t: TranslateFn) {
  return z
    .object({
      hasCompany: z.union([z.literal(true), z.literal(false)], {
        error: t('onboarding.companyChooseOption'),
      }),
      nipCompany: z.string().optional(),
    })
    .refine(
      (data) => !data.hasCompany || (data.nipCompany?.trim()?.length ?? 0) > 0,
      { message: t('onboarding.companyNipRequired'), path: ['nipCompany'] },
    );
}

/** Step 4: skills (no minimum required) */
export const stepSkillsSchema = z.object({
  selectedSkillIds: z.array(z.string()),
});

/** Step 5: default message optional */
export const stepDefaultMessageSchema = z.object({
  defaultMessage: z.string().optional(),
});

/** Step 7: profile form (name required) */
export const stepProfileFormSchema = z.object({
  profileName: z.string().min(2, 'Nazwa profilu musi mieć co najmniej 2 znaki').max(200),
  profileEmail: z.string().email('Nieprawidłowy adres e-mail').optional().or(z.literal('')),
  profileWebsite: z.string().url('Nieprawidłowy adres URL').optional().or(z.literal('')),
  profilePhone: z.string().max(30).optional(),
  profileLocationId: z.string().optional(),
  profileAboutUs: z.string().max(2000).optional(),
});

export type StepPhoneInput = z.infer<typeof stepPhoneSchema>;
export type StepNameInput = z.infer<ReturnType<typeof stepNameSchema>>;
export type StepAccountTypeInput = z.infer<
  ReturnType<typeof stepAccountTypeSchema>
>;
export type StepCompanyInput = z.infer<ReturnType<typeof stepCompanySchema>>;
export type StepSkillsInput = z.infer<typeof stepSkillsSchema>;
export type StepDefaultMessageInput = z.infer<typeof stepDefaultMessageSchema>;
export type StepProfileFormInput = z.infer<typeof stepProfileFormSchema>;
