/** Token validity in hours for password reset links. */
export const PASSWORD_RESET_EXPIRY_HOURS = 1;

export const ACCOUNT_TYPES = ['CLIENT', 'FREELANCER'] as const;
export type UpdateProfileAccountType = (typeof ACCOUNT_TYPES)[number];

export const LANGUAGES = ['POLISH', 'ENGLISH'] as const;
export type UserLanguage = (typeof LANGUAGES)[number];
