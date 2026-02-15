import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'validation.rejectReasonMinLength' })
  @MaxLength(2000, { message: 'validation.rejectReasonMaxLength' })
  reason: string;
}
