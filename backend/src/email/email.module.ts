import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [forwardRef(() => MailerModule)],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
