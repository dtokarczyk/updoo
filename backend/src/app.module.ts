import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { PrismaModule } from './prisma/prisma.module';
import { I18nModule } from './i18n/i18n.module';

@Module({
  imports: [PrismaModule, AuthModule, ListingsModule, I18nModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
