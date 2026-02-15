import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Nazwa profilu musi mieć co najmniej 2 znaki')
    .max(200, 'Nazwa profilu może mieć co najwyżej 200 znaków'),
  slug: z
    .string()
    .min(2, 'Adres wizytówki musi mieć co najmniej 2 znaki')
    .max(100, 'Adres wizytówki może mieć co najwyżej 100 znaków')
    .regex(
      slugRegex,
      'Adres: tylko małe litery, cyfry i myślniki (np. moja-firma)',
    ),
  email: z
    .string()
    .min(1, 'Adres e-mail jest wymagany')
    .email('Wpisz poprawny adres e-mail'),
  website: z
    .string()
    .refine(
      (val) => !val || val === '' || z.string().url().safeParse(val).success,
      {
        message: 'Nieprawidłowy adres URL',
      },
    ),
  phone: z
    .string()
    .max(30, 'Numer telefonu może mieć co najwyżej 30 znaków')
    .optional(),
  locationId: z.string().optional(),
  aboutUs: z
    .string()
    .min(1, 'Opis "O nas" jest wymagany')
    .max(2000, 'Opis może mieć co najwyżej 2000 znaków'),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const defaultProfileFormValues: ProfileFormValues = {
  name: '',
  slug: '',
  email: '',
  website: '',
  phone: '',
  locationId: '',
  aboutUs: '',
};
