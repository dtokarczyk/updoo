import { Module } from '@nestjs/common';
import { MailerLogService } from './mailer-log.service';

@Module({
  providers: [MailerLogService],
  exports: [MailerLogService],
})
export class MailerLogModule {}
