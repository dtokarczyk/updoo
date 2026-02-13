import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { AgreementsAcceptedGuard } from '../auth/agreements-accepted.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ApplyToJobDto } from './dto/apply-to-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { RejectJobDto } from './dto/reject-job.dto';
import { FavoritesService } from './favorites.service';
import { JobsService } from './jobs.service';
import { parseLanguageFromHeader } from '../common/parse-language.helper';
import { JobLanguage } from '@prisma/client';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly favoritesService: FavoritesService,
  ) {}

  @Get('categories')
  @UseGuards(OptionalJwtAuthGuard, AgreementsAcceptedGuard)
  getCategories(
    @Headers('accept-language') acceptLanguage?: string,
    @GetUser() user?: JwtUser,
  ) {
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage
      ? parseLanguageFromHeader(acceptLanguage)
      : null;
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
  @UseGuards(OptionalJwtAuthGuard, AgreementsAcceptedGuard)
  async getFeed(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('categoryId') categoryId?: string,
    @Query('skillIds') skillIds?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @GetUser() user?: JwtUser,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const pageSizeNum = pageSize
      ? Math.min(Math.max(1, parseInt(pageSize, 10) || 15), 100)
      : 15;
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage
      ? parseLanguageFromHeader(acceptLanguage)
      : null;
    const userLanguage = (user?.language || 'POLISH') as JobLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    const parsedSkillIds = skillIds
      ? skillIds
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : undefined;
    const result = await this.jobsService.getFeed(
      pageNum,
      pageSizeNum,
      user?.id,
      user?.accountType === 'ADMIN',
      categoryId,
      parsedSkillIds,
      finalLanguage,
    );
    // Ensure rate is never sent to unauthenticated clients (controller-level guard)
    if (!user) {
      result.items = result.items.map(({ rate: _r, ...item }) => ({
        ...item,
        rate: null,
      }));
    }
    return result;
  }

  @Get('popular-skills')
  getPopularSkills(@Query('categoryId') categoryId?: string) {
    if (!categoryId) {
      // Without category context "popular skills" would not be meaningful, return empty list.
      return [];
    }
    return this.jobsService.getPopularSkillsForCategory(categoryId);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  getFavorites(
    @GetUser() user: JwtUser,
    @Headers('accept-language') acceptLanguage: string | undefined,
  ) {
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage
      ? parseLanguageFromHeader(acceptLanguage)
      : null;
    const userLanguage = (user.language || 'POLISH') as JobLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    return this.favoritesService.getFavoriteJobs(user.id, finalLanguage);
  }

  @Get('my-applications')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  getMyApplications(
    @GetUser() user: JwtUser,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage
      ? parseLanguageFromHeader(acceptLanguage)
      : null;
    const userLanguage = (user.language || 'POLISH') as JobLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    return this.jobsService.getUserApplications(user.id, finalLanguage, 5);
  }

  @Get('my-jobs')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  getMyJobs(
    @GetUser() user: JwtUser,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage
      ? parseLanguageFromHeader(acceptLanguage)
      : null;
    const userLanguage = (user.language || 'POLISH') as JobLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    return this.jobsService.getUserJobs(user.id, finalLanguage, 5);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  getPendingJobs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @GetUser() user?: JwtUser,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const pageSizeNum = pageSize
      ? Math.min(Math.max(1, parseInt(pageSize, 10) || 15), 100)
      : 15;
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage
      ? parseLanguageFromHeader(acceptLanguage)
      : null;
    const userLanguage = (user?.language || 'POLISH') as JobLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    return this.jobsService.getPendingJobs(
      pageNum,
      pageSizeNum,
      user!.id,
      user!.accountType === 'ADMIN',
      finalLanguage,
    );
  }

  /** Public OG image for social sharing (no auth). Serves from storage or generates on-the-fly. */
  @Get(':id/og-image')
  async getJobOgImage(
    @Param('id') id: string,
    @Res({ passthrough: false }) res: Response,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const headerLanguage = acceptLanguage
      ? parseLanguageFromHeader(acceptLanguage)
      : null;
    const language = (headerLanguage || JobLanguage.POLISH) as JobLanguage;
    const result = await this.jobsService.getJobOgImageBuffer(id, language);
    if (!result) {
      res.status(404).send();
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.contentType(result.contentType);
    res.send(result.buffer);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard, AgreementsAcceptedGuard)
  async getJob(
    @Param('id') id: string,
    @Headers('accept-language') acceptLanguage?: string,
    @GetUser() user?: JwtUser,
  ) {
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage
      ? parseLanguageFromHeader(acceptLanguage)
      : null;
    const userLanguage = (user?.language || 'POLISH') as JobLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    const result = await this.jobsService.getJob(
      id,
      user?.id,
      user?.accountType === 'ADMIN',
      finalLanguage,
    );
    // Ensure rate is never sent to unauthenticated clients (controller-level guard)
    if (!user) {
      const { rate: _r, ...rest } = result;
      return { ...rest, rate: null };
    }
    return result;
  }

  @Get(':id/prev-next')
  @UseGuards(OptionalJwtAuthGuard, AgreementsAcceptedGuard)
  getPrevNextJob(
    @Param('id') id: string,
    @Headers('accept-language') acceptLanguage?: string,
    @GetUser() user?: JwtUser,
  ) {
    // Priority: Accept-Language header > user language > default POLISH
    const headerLanguage = acceptLanguage
      ? parseLanguageFromHeader(acceptLanguage)
      : null;
    const userLanguage = (user?.language || 'POLISH') as JobLanguage;
    const finalLanguage = headerLanguage || userLanguage;
    return this.jobsService.getPrevNextJob(
      id,
      user?.id,
      user?.accountType === 'ADMIN',
      finalLanguage,
    );
  }

  @Post(':id/apply')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  applyToJob(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @Body() dto: ApplyToJobDto,
  ) {
    return this.jobsService.applyToJob(
      id,
      user.id,
      user.accountType,
      dto.message,
    );
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  addFavorite(@Param('id') id: string, @GetUser() user: JwtUser) {
    return this.favoritesService.addFavorite(user.id, id);
  }

  @Delete(':id/favorite')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  removeFavorite(@Param('id') id: string, @GetUser() user: JwtUser) {
    return this.favoritesService.removeFavorite(user.id, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  createJob(@GetUser() user: JwtUser, @Body() dto: CreateJobDto) {
    const userLanguage = (user.language || 'POLISH') as JobLanguage;
    return this.jobsService.createJob(
      user.id,
      user.accountType,
      dto,
      userLanguage,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  updateJob(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @Body() dto: CreateJobDto,
  ) {
    const userLanguage = (user.language || 'POLISH') as JobLanguage;
    return this.jobsService.updateJob(
      id,
      user.id,
      user.accountType,
      dto,
      userLanguage,
    );
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  publishJob(@Param('id') id: string, @GetUser() user: JwtUser) {
    const userLanguage = (user.language || 'POLISH') as JobLanguage;
    return this.jobsService.publishJob(
      id,
      user.id,
      user.accountType === 'ADMIN',
      userLanguage,
    );
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  rejectJob(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @Body() dto: RejectJobDto,
  ) {
    const userLanguage = (user.language || 'POLISH') as JobLanguage;
    return this.jobsService.rejectJob(
      id,
      user.id,
      user.accountType === 'ADMIN',
      dto.reason,
      userLanguage,
    );
  }

  @Patch(':id/close')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  closeJob(@Param('id') id: string, @GetUser() user: JwtUser) {
    const userLanguage = (user.language || 'POLISH') as JobLanguage;
    return this.jobsService.closeJob(
      id,
      user.id,
      user.accountType,
      userLanguage,
    );
  }
}
