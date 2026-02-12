import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

const COMPANY_SIZE_VALUES = [
  'FREELANCER',
  'MICRO',
  'SMALL',
  'MEDIUM',
  'LARGE',
] as const;

/** NIP: 10 digits, optional spaces/dashes stripped on backend. */
export class LinkCompanyDto {
  @IsString()
  @Matches(/^[\d\s-]{10,14}$/, {
    message: 'validation.nipInvalid',
  })
  nip: string;

  @IsOptional()
  @IsIn(COMPANY_SIZE_VALUES, { message: 'validation.companySizeInvalid' })
  companySize?: (typeof COMPANY_SIZE_VALUES)[number];
}
