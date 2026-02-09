import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RegonController } from './regon.controller';
import { RegonService } from './regon.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [RegonController],
  providers: [RegonService],
  exports: [RegonService],
})
export class RegonModule { }
