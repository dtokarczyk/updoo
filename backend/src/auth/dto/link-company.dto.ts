import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { COMPANY_SIZE_VALUES } from '../../company/company.constants';
import type { CompanySizeValue } from '../../company/company.types';

/** NIP: 10 digits, optional spaces/dashes stripped on backend. */
export class LinkCompanyDto {
  @IsString()
  @Matches(/^[\d\s-]{10,14}$/, {
    message: 'validation.nipInvalid',
  })
  nip: string;

  @IsOptional()
  @IsIn(COMPANY_SIZE_VALUES, { message: 'validation.companySizeInvalid' })
  companySize?: CompanySizeValue;
}
