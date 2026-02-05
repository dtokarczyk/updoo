import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { FavoritesService } from './favorites.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentGeneratorModule } from '../content-generator/content-generator.module';

@Module({
  imports: [PrismaModule, ContentGeneratorModule],
  controllers: [JobsController],
  providers: [JobsService, FavoritesService],
  exports: [JobsService, FavoritesService],
})
export class JobsModule { }
