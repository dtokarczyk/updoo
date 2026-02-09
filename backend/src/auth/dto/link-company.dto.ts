import { IsString, Matches } from 'class-validator';

/** NIP: 10 digits, optional spaces/dashes stripped on backend. */
export class LinkCompanyDto {
  @IsString()
  @Matches(/^[\d\s-]{10,14}$/, {
    message: 'validation.nipInvalid',
  })
  nip: string;
}
