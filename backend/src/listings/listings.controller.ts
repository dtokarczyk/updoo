import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ApplyToListingDto } from './dto/apply-to-listing.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { FavoritesService } from './favorites.service';
import { ListingsService } from './listings.service';
import { ListingLanguage } from '@prisma/client';

@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly favoritesService: FavoritesService,
  ) { }

  @Get('categories')
  @UseGuards(OptionalJwtAuthGuard)
  getCategories(@GetUser() user?: JwtUser) {
    const userLanguage = (user?.language || 'POLISH') as ListingLanguage;
    return this.listingsService.getCategories(userLanguage);
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
    @Query('categoryId') categoryId?: string,
    @Query('language') language?: string,
    @GetUser() user?: JwtUser,
  ) {
    const takeNum = take ? Math.min(parseInt(take, 10) || 50, 100) : 50;
    const userLanguage = (user?.language || 'POLISH') as ListingLanguage;
    return this.listingsService.getFeed(takeNum, cursor, user?.id, categoryId, language, userLanguage);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  getFavorites(@GetUser() user: JwtUser) {
    const userLanguage = (user.language || 'POLISH') as ListingLanguage;
    return this.favoritesService.getFavoriteListings(user.id, userLanguage);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getListing(
    @Param('id') id: string,
    @GetUser() user?: JwtUser,
  ) {
    const userLanguage = (user?.language || 'POLISH') as ListingLanguage;
    return this.listingsService.getListing(id, user?.id, user?.accountType === 'ADMIN', userLanguage);
  }

  @Post(':id/apply')
  @UseGuards(JwtAuthGuard)
  applyToListing(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @Body() dto: ApplyToListingDto,
  ) {
    return this.listingsService.applyToListing(id, user.id, user.accountType, dto.message);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  addFavorite(@Param('id') id: string, @GetUser() user: JwtUser) {
    return this.favoritesService.addFavorite(user.id, id);
  }

  @Delete(':id/favorite')
  @UseGuards(JwtAuthGuard)
  removeFavorite(@Param('id') id: string, @GetUser() user: JwtUser) {
    return this.favoritesService.removeFavorite(user.id, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createListing(@GetUser() user: JwtUser, @Body() dto: CreateListingDto) {
    const userLanguage = (user.language || 'POLISH') as ListingLanguage;
    return this.listingsService.createListing(user.id, user.accountType, dto, userLanguage);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateListing(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @Body() dto: CreateListingDto,
  ) {
    const userLanguage = (user.language || 'POLISH') as ListingLanguage;
    return this.listingsService.updateListing(id, user.id, user.accountType, dto, userLanguage);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  publishListing(@Param('id') id: string, @GetUser() user: JwtUser) {
    const userLanguage = (user.language || 'POLISH') as ListingLanguage;
    return this.listingsService.publishListing(id, user.id, user.accountType === 'ADMIN', userLanguage);
  }
}
