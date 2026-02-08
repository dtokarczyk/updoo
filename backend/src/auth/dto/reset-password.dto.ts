import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6, { message: 'validation.passwordMinLength' })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}
