export const COMPANY_SIZE_VALUES = [
  'FREELANCER',
  'MICRO',
  'SMALL',
  'MEDIUM',
  'LARGE',
] as const;

export type CompanySizeValue = (typeof COMPANY_SIZE_VALUES)[number];
