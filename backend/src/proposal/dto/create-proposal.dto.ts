import { IsEmail, IsEnum } from 'class-validator';
import { CreateJobDto } from '../../jobs/dto/create-job.dto';
import { ProposalReason } from '@prisma/client';

/**
 * CreateJobDto fields plus email and reason for invitation proposals.
 */
export class CreateProposalDto extends CreateJobDto {
  @IsEmail()
  email!: string;

  @IsEnum(ProposalReason)
  reason!: ProposalReason;
}
