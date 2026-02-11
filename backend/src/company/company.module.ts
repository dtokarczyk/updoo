import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountModule } from '../account/account.module';
import { AgreementsModule } from '../agreements/agreements.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RegonModule } from '../regon/regon.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

@Module({
  imports: [
    AuthModule,
    AgreementsModule,
    forwardRef(() => AccountModule),
    PrismaModule,
    forwardRef(() => RegonModule),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
