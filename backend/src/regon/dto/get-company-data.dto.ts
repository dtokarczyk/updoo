import { IsOptional, IsString, Matches } from 'class-validator';

/**
 * Query params for GET /regon/company.
 * Exactly one of nip, regon, krs must be provided.
 */
export class GetCompanyDataQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'NIP must be 10 digits' })
  nip?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{9}$|^\d{14}$/, { message: 'REGON must be 9 or 14 digits' })
  regon?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'KRS must be 10 digits' })
  krs?: string;
}
