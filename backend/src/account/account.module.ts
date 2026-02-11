import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AgreementsModule } from '../agreements/agreements.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [AuthModule, AgreementsModule, PrismaModule, StorageModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
