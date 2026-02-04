import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const ACCOUNT_TYPES = ['CLIENT', 'FREELANCER'] as const;
export type UpdateProfileAccountType = (typeof ACCOUNT_TYPES)[number];

export const LANGUAGES = ['POLISH', 'ENGLISH'] as const;
export type UserLanguage = (typeof LANGUAGES)[number];

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;

  @IsOptional()
  @IsString()
  oldPassword?: string;

  @IsOptional()
  @IsIn(ACCOUNT_TYPES, { message: 'accountType must be CLIENT or FREELANCER' })
  accountType?: UpdateProfileAccountType;

  @IsOptional()
  @IsIn(LANGUAGES, { message: 'language must be POLISH or ENGLISH' })
  language?: UserLanguage;

  @IsOptional()
  @IsString({ each: true })
  skillIds?: string[];
}
