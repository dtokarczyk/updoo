import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class AcceptProposalDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsBoolean()
  termsAccepted: boolean;
}
