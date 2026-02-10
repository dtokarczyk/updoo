import { Module, forwardRef } from '@nestjs/common';
import { AgreementsModule } from '../agreements/agreements.module';
import { AuthModule } from '../auth/auth.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { FavoritesService } from './favorites.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentGeneratorModule } from '../content-generator/content-generator.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AgreementsModule,
    AuthModule,
    PrismaModule,
    ContentGeneratorModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [JobsController],
  providers: [JobsService, FavoritesService],
  exports: [JobsService, FavoritesService],
})
export class JobsModule { }
