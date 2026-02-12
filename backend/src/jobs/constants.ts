import { JobLanguage } from '@prisma/client';

export const DEFAULT_CATEGORIES = [
  {
    slug: 'programming',
    translations: [
      { language: JobLanguage.POLISH, name: 'Programowanie' },
      { language: JobLanguage.ENGLISH, name: 'Programming' },
    ],
  },
  {
    slug: 'design',
    translations: [
      { language: JobLanguage.POLISH, name: 'Design' },
      { language: JobLanguage.ENGLISH, name: 'Design' },
    ],
  },
  {
    slug: 'marketing',
    translations: [
      { language: JobLanguage.POLISH, name: 'Marketing' },
      { language: JobLanguage.ENGLISH, name: 'Marketing' },
    ],
  },
  {
    slug: 'writing',
    translations: [
      { language: JobLanguage.POLISH, name: 'Pisanie' },
      { language: JobLanguage.ENGLISH, name: 'Writing' },
    ],
  },
  {
    slug: 'office-working',
    translations: [
      { language: JobLanguage.POLISH, name: 'Prace biurowe' },
      { language: JobLanguage.ENGLISH, name: 'Office Work' },
    ],
  },
  {
    slug: 'other',
    translations: [
      { language: JobLanguage.POLISH, name: 'Inne' },
      { language: JobLanguage.ENGLISH, name: 'Other' },
    ],
  },
];

export const ALLOWED_CATEGORY_SLUGS = DEFAULT_CATEGORIES.map((c) => c.slug);
