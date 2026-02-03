import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
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
  @UseGuards(OptionalJwtAuthGuard)
  getFeed(
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
    @GetUser() user?: JwtUser,
  ) {
    const takeNum = take ? Math.min(parseInt(take, 10) || 50, 100) : 50;
    return this.listingsService.getFeed(takeNum, cursor, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createListing(@GetUser() user: JwtUser, @Body() dto: CreateListingDto) {
    return this.listingsService.createListing(user.id, user.accountType, dto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  publishListing(@Param('id') id: string, @GetUser() user: JwtUser) {
    return this.listingsService.publishListing(id, user.id, user.accountType === 'ADMIN');
  }
}
