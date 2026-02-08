import { IsString, MinLength } from 'class-validator';

export class AcceptAgreementsDto {
  @IsString()
  @MinLength(1, { message: 'validation.required' })
  termsVersion: string;

  @IsString()
  @MinLength(1, { message: 'validation.required' })
  privacyPolicyVersion: string;
}
