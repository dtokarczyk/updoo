import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminGuard } from './admin.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, EmailModule, PrismaModule],
  controllers: [AdminController],
  providers: [AdminGuard, AdminService],
})
export class AdminModule {}
