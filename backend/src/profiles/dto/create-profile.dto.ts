import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsEmail,
  IsUrl,
  Matches,
} from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @MinLength(2, { message: 'validation.profileNameMinLength' })
  @MaxLength(200, { message: 'validation.profileNameMaxLength' })
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'validation.profileSlugMinLength' })
  @MaxLength(100, { message: 'validation.profileSlugMaxLength' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'validation.profileSlugInvalid',
  })
  slug?: string;

  @IsOptional()
  @IsEmail({}, { message: 'validation.emailInvalid' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsUrl({}, { message: 'validation.websiteInvalid' })
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'validation.phoneMaxLength' })
  phone?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'validation.aboutUsMaxLength' })
  aboutUs?: string;
}
