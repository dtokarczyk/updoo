import { IsBoolean, IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'validation.passwordMinLength' })
  password: string;

  @IsString()
  @MinLength(8, { message: 'validation.passwordMinLength' })
  confirmPassword: string;

  @IsBoolean()
  termsAccepted: boolean;
}
