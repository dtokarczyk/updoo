import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyToJobDto {
  /** Optional message from freelancer to job author. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
