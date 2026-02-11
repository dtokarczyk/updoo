import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsEmail,
  IsUrl,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'validation.profileNameMinLength' })
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  aboutUs?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverPhotoUrl?: string;
}
