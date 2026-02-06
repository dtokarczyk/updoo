import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentGeneratorService } from './content-generator.service';
import { ContentGeneratorController } from './content-generator.controller';
import { ContentGeneratorSchedulerService } from './content-generator-scheduler.service';

@Module({
  imports: [AiModule, PrismaModule],
  controllers: [ContentGeneratorController],
  providers: [ContentGeneratorService, ContentGeneratorSchedulerService],
  exports: [ContentGeneratorService],
})
export class ContentGeneratorModule {}

