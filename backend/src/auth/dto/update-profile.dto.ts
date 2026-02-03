import { IsIn, IsOptional, IsString } from 'class-validator';

export const ACCOUNT_TYPES = ['CLIENT', 'FREELANCER'] as const;
export type UpdateProfileAccountType = (typeof ACCOUNT_TYPES)[number];

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(ACCOUNT_TYPES, { message: 'accountType must be CLIENT or FREELANCER' })
  accountType?: UpdateProfileAccountType;
}
