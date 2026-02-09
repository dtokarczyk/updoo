import { Module } from '@nestjs/common';
import { RegonController } from './regon.controller';
import { RegonService } from './regon.service';

@Module({
  controllers: [RegonController],
  providers: [RegonService],
  exports: [RegonService],
})
export class RegonModule {}
