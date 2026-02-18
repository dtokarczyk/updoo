import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { EmailTemplatesModule } from '../email-templates/email-templates.module';
import { AuthModule } from '../auth/auth.module';
import { AgreementsModule } from '../agreements/agreements.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    EmailTemplatesModule,
    AuthModule,
    AgreementsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
