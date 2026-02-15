import { Module } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';

@Module({
  providers: [EmailTemplatesService],
  exports: [EmailTemplatesService],
})
export class EmailTemplatesModule {}
