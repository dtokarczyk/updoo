import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { FavoritesService } from './favorites.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ListingsController],
  providers: [ListingsService, FavoritesService],
  exports: [ListingsService, FavoritesService],
})
export class ListingsModule { }
