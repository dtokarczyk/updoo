import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyToListingDto {
  /** Optional message from freelancer to listing author. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
