import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const ACCOUNT_TYPES = ['CLIENT', 'FREELANCER'] as const;
export type UpdateProfileAccountType = (typeof ACCOUNT_TYPES)[number];

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;

  @IsOptional()
  @IsIn(ACCOUNT_TYPES, { message: 'accountType must be CLIENT or FREELANCER' })
  accountType?: UpdateProfileAccountType;
}
