import { z } from 'zod';

export const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Nazwa profilu musi mieć co najmniej 2 znaki')
    .max(200),
  email: z
    .string()
    .email('Nieprawidłowy adres e-mail')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('Nieprawidłowy adres URL')
    .optional()
    .or(z.literal('')),
  phone: z.string().max(30).optional(),
  locationId: z.string().optional(),
  aboutUs: z.string().max(2000).optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const defaultProfileFormValues: ProfileFormValues = {
  name: '',
  email: '',
  website: '',
  phone: '',
  locationId: '',
  aboutUs: '',
};
