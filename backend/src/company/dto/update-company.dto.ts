import { IsIn, IsOptional } from 'class-validator';
import {
  COMPANY_SIZE_VALUES,
  type CompanySizeValue,
} from '../constants';

export { COMPANY_SIZE_VALUES };
export type { CompanySizeValue };

export class UpdateCompanyDto {
  @IsOptional()
  @IsIn(COMPANY_SIZE_VALUES, { message: 'validation.companySizeInvalid' })
  companySize?: CompanySizeValue;
}
