import { Module, forwardRef } from '@nestjs/common';
import { MailerLogModule } from '../mailer-log/mailer-log.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerSendWebhookController } from './mailersend-webhook.controller';
import { MailerService } from './mailer.service';
import { MailerWebhookService } from './mailer-webhook.service';

@Module({
  imports: [forwardRef(() => MailerLogModule), PrismaModule],
  controllers: [MailerSendWebhookController],
  providers: [MailerService, MailerWebhookService],
  exports: [MailerService],
})
export class MailerModule {}
