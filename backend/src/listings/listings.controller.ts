import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ApplyToListingDto } from './dto/apply-to-listing.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { FavoritesService } from './favorites.service';
import { ListingsService } from './listings.service';
import { ListingLanguage } from '@prisma/client';

/**
 * Parses Accept-Language header and returns ListingLanguage.
 * Accepts "pl", "en", "pl-PL", "en-US", etc.
 * Returns POLISH for "pl", ENGLISH for "en", default POLISH otherwise.
 */
function parseLanguageFromHeader(acceptLanguage?: string): ListingLanguage {
  if (!acceptLanguage) return ListingLanguage.POLISH;

  const normalized = acceptLanguage.toLowerCase().trim();
  const langCode = normalized.split('-')[0];

  if (langCode === 'en') return ListingLanguage.ENGLISH;
  if (langCode === 'pl') return ListingLanguage.POLISH;

  return ListingLanguage.POLISH;
}

@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly favoritesService: FavoritesService,
  ) { }

  @Get('categories')
  @UseGuards(OptionalJwtAuthGuard)
  getCategories(
    @Headers('accept-language') acceptLanguage?: string,
    @GetUser() user?: JwtUser,
  ) {
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage ? parseLanguageFromHeader(acceptLanguage) : null;
    const userLanguage = (user?.language || 'POLISH') as ListingLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    return this.listingsService.getCategories(finalLanguage);
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
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('categoryId') categoryId?: string,
    @Query('language') language?: string,
    @Query('skillIds') skillIds?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @GetUser() user?: JwtUser,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const pageSizeNum = pageSize ? Math.min(Math.max(1, parseInt(pageSize, 10) || 15), 100) : 15;
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage ? parseLanguageFromHeader(acceptLanguage) : null;
    const userLanguage = (user?.language || 'POLISH') as ListingLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    const parsedSkillIds = skillIds
      ? skillIds.split(',').map((id) => id.trim()).filter(Boolean)
      : undefined;
    return this.listingsService.getFeed(pageNum, pageSizeNum, user?.id, categoryId, language, parsedSkillIds, finalLanguage);
  }

  @Get('popular-skills')
  getPopularSkills(
    @Query('categoryId') categoryId?: string,
  ) {
    if (!categoryId) {
      // Without category context "popular skills" would not be meaningful, return empty list.
      return [];
    }
    return this.listingsService.getPopularSkillsForCategory(categoryId);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  getFavorites(
    @GetUser() user: JwtUser,
    @Headers('accept-language') acceptLanguage: string | undefined,
  ) {
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage ? parseLanguageFromHeader(acceptLanguage) : null;
    const userLanguage = (user.language || 'POLISH') as ListingLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    return this.favoritesService.getFavoriteListings(user.id, finalLanguage);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getListing(
    @Param('id') id: string,
    @Headers('accept-language') acceptLanguage?: string,
    @GetUser() user?: JwtUser,
  ) {
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage ? parseLanguageFromHeader(acceptLanguage) : null;
    const userLanguage = (user?.language || 'POLISH') as ListingLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    return this.listingsService.getListing(id, user?.id, user?.accountType === 'ADMIN', finalLanguage);
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
