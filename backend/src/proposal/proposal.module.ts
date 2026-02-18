import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { EmailTemplatesModule } from '../email-templates/email-templates.module';
import { AgreementsModule } from '../agreements/agreements.module';
import { JobsModule } from '../jobs/jobs.module';
import { I18nModule } from '../i18n/i18n.module';
import { ProposalController } from './proposal.controller';
import { ProposalService } from './proposal.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    EmailTemplatesModule,
    AgreementsModule,
    JobsModule,
    I18nModule,
  ],
  controllers: [ProposalController],
  providers: [ProposalService],
  exports: [ProposalService],
})
export class ProposalModule {}
