import { IsIn, IsOptional } from 'class-validator';

export const COMPANY_SIZE_VALUES = [
  'FREELANCER',
  'MICRO',
  'SMALL',
  'MEDIUM',
  'LARGE',
] as const;

export class UpdateCompanyDto {
  @IsOptional()
  @IsIn(COMPANY_SIZE_VALUES, { message: 'validation.companySizeInvalid' })
  companySize?: (typeof COMPANY_SIZE_VALUES)[number];
}
