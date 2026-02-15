import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  private assertNotClient(user: JwtUser) {
    if (user.accountType === 'CLIENT') {
      throw new ForbiddenException('errors.contractorProfileClientForbidden');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetUser() user: JwtUser, @Body() dto: CreateProfileDto) {
    this.assertNotClient(user);
    return this.profilesService.create(user.id, dto);
  }

  /** Public list of verified visiting cards (profiles) with pagination. */
  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const limitNum = limit
      ? Math.min(50, Math.max(1, parseInt(limit, 10) || 24))
      : 24;
    return this.profilesService.findAllVerified(pageNum, limitNum);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyProfiles(@GetUser() user: JwtUser) {
    return this.profilesService.findMyProfiles(user.id);
  }

  @Get('check-slug/:slug')
  @UseGuards(JwtAuthGuard)
  checkSlug(
    @Param('slug') slug: string,
    @Query('excludeProfileId') excludeProfileId: string | undefined,
  ) {
    return this.profilesService.checkSlugAvailability(slug, excludeProfileId);
  }

  @Get('slug/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  getBySlug(@Param('slug') slug: string, @GetUser() user?: JwtUser) {
    return this.profilesService.findBySlug(
      slug,
      user?.id,
      user?.accountType === 'ADMIN',
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@Param('id') id: string) {
    return this.profilesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @Body() dto: UpdateProfileDto,
  ) {
    this.assertNotClient(user);
    return this.profilesService.update(
      id,
      user.id,
      user.accountType === 'ADMIN',
      dto,
    );
  }

  @Post(':id/cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async uploadCover(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    this.assertNotClient(user);
    if (!file?.buffer) {
      throw new BadRequestException('File is required');
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Use JPEG, PNG, WebP or GIF.',
      );
    }
    return this.profilesService.uploadCover(
      id,
      user.id,
      user.accountType === 'ADMIN',
      file.buffer,
    );
  }

  @Delete(':id/cover')
  @UseGuards(JwtAuthGuard)
  removeCover(@Param('id') id: string, @GetUser() user: JwtUser) {
    this.assertNotClient(user);
    return this.profilesService.removeCover(
      id,
      user.id,
      user.accountType === 'ADMIN',
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @GetUser() user: JwtUser) {
    this.assertNotClient(user);
    return this.profilesService.remove(
      id,
      user.id,
      user.accountType === 'ADMIN',
    );
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard)
  verify(@Param('id') id: string, @GetUser() user: JwtUser) {
    return this.profilesService.verify(id, user.accountType === 'ADMIN');
  }
}
