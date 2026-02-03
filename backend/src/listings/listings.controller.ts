import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) { }

  @Get('categories')
  getCategories() {
    return this.listingsService.getCategories();
  }

  @Get('locations')
  getLocations() {
    return this.listingsService.getLocations();
  }

  @Get('skills')
  getSkills() {
    return this.listingsService.getSkills();
  }

  @Get('feed')
  getFeed(@Query('take') take?: string, @Query('cursor') cursor?: string) {
    const takeNum = take ? Math.min(parseInt(take, 10) || 50, 100) : 50;
    return this.listingsService.getFeed(takeNum, cursor);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createListing(@GetUser() user: JwtUser, @Body() dto: CreateListingDto) {
    return this.listingsService.createListing(user.id, user.accountType, dto);
  }
}
