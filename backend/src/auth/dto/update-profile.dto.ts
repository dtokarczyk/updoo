import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ACCOUNT_TYPES, LANGUAGES } from '../auth.constants';
import type { UpdateProfileAccountType, UserLanguage } from '../auth.types';

export { ACCOUNT_TYPES, LANGUAGES };
export type { UpdateProfileAccountType, UserLanguage } from '../auth.types';

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
  @MinLength(6, { message: 'validation.passwordMinLength' })
  password?: string;

  @IsOptional()
  @IsString()
  oldPassword?: string;

  @IsOptional()
  @IsIn(ACCOUNT_TYPES, { message: 'validation.accountTypeInvalid' })
  accountType?: UpdateProfileAccountType;

  @IsOptional()
  @IsIn(LANGUAGES, { message: 'validation.languageInvalid' })
  language?: UserLanguage;

  @IsOptional()
  @IsString({ each: true })
  skillIds?: string[];

  @IsOptional()
  @IsString()
  defaultMessage?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
