import { Module, forwardRef } from '@nestjs/common';
import { AgreementsModule } from '../agreements/agreements.module';
import { AuthModule } from '../auth/auth.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { FavoritesService } from './favorites.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [
    AgreementsModule,
    AuthModule,
    PrismaModule,
    AiModule,
    EmailModule,
    I18nModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [JobsController],
  providers: [JobsService, FavoritesService],
  exports: [JobsService, FavoritesService],
})
export class JobsModule {}
