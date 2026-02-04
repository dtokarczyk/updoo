import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ApplyToJobDto } from './dto/apply-to-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { FavoritesService } from './favorites.service';
import { JobsService } from './jobs.service';
import { JobLanguage } from '@prisma/client';

/**
 * Parses Accept-Language header and returns JobLanguage.
 * Accepts "pl", "en", "pl-PL", "en-US", etc.
 * Returns POLISH for "pl", ENGLISH for "en", default POLISH otherwise.
 */
function parseLanguageFromHeader(acceptLanguage?: string): JobLanguage {
  if (!acceptLanguage) return JobLanguage.POLISH;

  const normalized = acceptLanguage.toLowerCase().trim();
  const langCode = normalized.split('-')[0];

  if (langCode === 'en') return JobLanguage.ENGLISH;
  if (langCode === 'pl') return JobLanguage.POLISH;

  return JobLanguage.POLISH;
}

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
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
    const userLanguage = (user?.language || 'POLISH') as JobLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    return this.jobsService.getCategories(finalLanguage);
  }

  @Get('locations')
  getLocations() {
    return this.jobsService.getLocations();
  }

  @Get('skills')
  getSkills() {
    return this.jobsService.getSkills();
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
    const userLanguage = (user?.language || 'POLISH') as JobLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    const parsedSkillIds = skillIds
      ? skillIds.split(',').map((id) => id.trim()).filter(Boolean)
      : undefined;
    return this.jobsService.getFeed(pageNum, pageSizeNum, user?.id, user?.accountType === 'ADMIN', categoryId, language, parsedSkillIds, finalLanguage);
  }

  @Get('popular-skills')
  getPopularSkills(
    @Query('categoryId') categoryId?: string,
  ) {
    if (!categoryId) {
      // Without category context "popular skills" would not be meaningful, return empty list.
      return [];
    }
    return this.jobsService.getPopularSkillsForCategory(categoryId);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  getFavorites(
    @GetUser() user: JwtUser,
    @Headers('accept-language') acceptLanguage: string | undefined,
  ) {
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage ? parseLanguageFromHeader(acceptLanguage) : null;
    const userLanguage = (user.language || 'POLISH') as JobLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    return this.favoritesService.getFavoriteJobs(user.id, finalLanguage);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getJob(
    @Param('id') id: string,
    @Headers('accept-language') acceptLanguage?: string,
    @GetUser() user?: JwtUser,
  ) {
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage ? parseLanguageFromHeader(acceptLanguage) : null;
    const userLanguage = (user?.language || 'POLISH') as JobLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    return this.jobsService.getJob(id, user?.id, user?.accountType === 'ADMIN', finalLanguage);
  }

  @Post(':id/apply')
  @UseGuards(JwtAuthGuard)
  applyToJob(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @Body() dto: ApplyToJobDto,
  ) {
    return this.jobsService.applyToJob(id, user.id, user.accountType, dto.message);
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
  createJob(@GetUser() user: JwtUser, @Body() dto: CreateJobDto) {
    const userLanguage = (user.language || 'POLISH') as JobLanguage;
    return this.jobsService.createJob(user.id, user.accountType, dto, userLanguage);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateJob(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @Body() dto: CreateJobDto,
  ) {
    const userLanguage = (user.language || 'POLISH') as JobLanguage;
    return this.jobsService.updateJob(id, user.id, user.accountType, dto, userLanguage);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  publishJob(@Param('id') id: string, @GetUser() user: JwtUser) {
    const userLanguage = (user.language || 'POLISH') as JobLanguage;
    return this.jobsService.publishJob(id, user.id, user.accountType === 'ADMIN', userLanguage);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  getPendingJobs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @GetUser() user?: JwtUser,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const pageSizeNum = pageSize ? Math.min(Math.max(1, parseInt(pageSize, 10) || 15), 100) : 15;
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage ? parseLanguageFromHeader(acceptLanguage) : null;
    const userLanguage = (user?.language || 'POLISH') as JobLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    return this.jobsService.getPendingJobs(pageNum, pageSizeNum, user!.id, user!.accountType === 'ADMIN', finalLanguage);
  }
}
