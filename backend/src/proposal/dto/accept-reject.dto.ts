import { IsNotEmpty, IsString } from 'class-validator';

export class ProposalTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
