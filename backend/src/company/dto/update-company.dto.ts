import { IsIn, IsOptional } from 'class-validator';
import { COMPANY_SIZE_VALUES } from '../company.constants';
import type { CompanySizeValue } from '../company.types';

export { COMPANY_SIZE_VALUES };
export type { CompanySizeValue };

export class UpdateCompanyDto {
  @IsOptional()
  @IsIn(COMPANY_SIZE_VALUES, { message: 'validation.companySizeInvalid' })
  companySize?: CompanySizeValue;
}
