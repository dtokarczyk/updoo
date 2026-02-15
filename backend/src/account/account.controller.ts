import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthService, AuthResponse } from '../auth/auth.service';
import type { AuthResponseUser } from '../auth/auth.types';
import { StorageService } from '../storage/storage.service';
import { AgreementsService } from '../agreements/agreements.service';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgreementsAcceptedGuard } from '../auth/agreements-accepted.guard';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { AccountService } from './account.service';

@Controller('auth')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
    private readonly agreementsService: AgreementsService,
    private readonly storageService: StorageService,
  ) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@GetUser() user: JwtUser): Promise<{
    user: AuthResponseUser;
    needsAgreementsAcceptance: boolean;
  }> {
    const full = await this.accountService.getUserForResponse(user.id);
    if (!full) {
      throw new UnauthorizedException();
    }
    const current = this.agreementsService.getCurrentVersions();
    const needsAgreementsAcceptance =
      full.acceptedTermsVersion == null ||
      full.acceptedPrivacyPolicyVersion == null ||
      (current.termsVersion != null &&
        full.acceptedTermsVersion !== current.termsVersion) ||
      (current.privacyPolicyVersion != null &&
        full.acceptedPrivacyPolicyVersion !== current.privacyPolicyVersion);
    return {
      user: full,
      needsAgreementsAcceptance,
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  async updateProfile(
    @GetUser() user: JwtUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ user: AuthResponse['user'] }> {
    return this.accountService.updateProfile(user.id, dto);
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  async uploadAvatar(
    @GetUser() user: JwtUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<{ user: AuthResponse['user']; avatarUrl: string }> {
    if (!file?.buffer) {
      throw new BadRequestException('File is required');
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Use JPEG, PNG, WebP or GIF.',
      );
    }
    if (!this.storageService.isConfigured()) {
      throw new BadRequestException('Avatar upload is not configured');
    }
    const avatarUrl = await this.storageService.uploadAvatar(
      file.buffer,
      user.id,
    );
    if (!avatarUrl) {
      throw new BadRequestException('Failed to upload avatar');
    }
    const { user: updatedUser } = await this.accountService.updateProfile(
      user.id,
      { avatarUrl },
    );
    return { user: updatedUser, avatarUrl };
  }

  @Delete('avatar')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  async removeAvatar(
    @GetUser() user: JwtUser,
  ): Promise<{ user: AuthResponse['user'] }> {
    return this.accountService.removeAvatar(user.id);
  }

  @Post('accept-agreements')
  @UseGuards(JwtAuthGuard)
  async acceptAgreements(
    @GetUser() user: JwtUser,
  ): Promise<{ user: AuthResponse['user'] }> {
    return this.accountService.acceptAgreements(user.id);
  }
}
