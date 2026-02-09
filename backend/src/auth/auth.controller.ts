import { Body, Controller, Get, Headers, Patch, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Request } from 'express';
import { AuthService, AuthResponse } from './auth.service';
import { AgreementsService } from '../agreements/agreements.service';
import { GetUser } from './get-user.decorator';
import type { JwtUser } from './get-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AgreementsAcceptedGuard } from './agreements-accepted.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LinkCompanyDto } from './dto/link-company.dto';
import { AuthGuard } from '@nestjs/passport';
import { I18nService, SupportedLanguage } from '../i18n/i18n.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly agreementsService: AgreementsService,
    private readonly i18nService: I18nService,
  ) { }

  private getLanguage(acceptLanguage?: string): SupportedLanguage {
    return this.i18nService.parseLanguageFromHeader(acceptLanguage);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<{ message: string }> {
    const lang = this.getLanguage(acceptLanguage);
    return this.authService.requestPasswordReset(dto, lang);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<{ message: string }> {
    const lang = this.getLanguage(acceptLanguage);
    return this.authService.resetPassword(dto, lang);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(): Promise<void> {
    // Passport redirects to Google; no body
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: Request & { user?: AuthResponse },
    @Res() res: Response,
  ): Promise<void> {
    const auth = req.user;
    if (!auth?.access_token) {
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      return;
    }
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login/callback?token=${encodeURIComponent(auth.access_token)}`);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@GetUser() user: JwtUser): Promise<{
    user: AuthResponse['user'];
    needsAgreementsAcceptance: boolean;
  }> {
    const full = await this.authService.validateUser({ sub: user.id, email: user.email });
    if (!full) {
      throw new UnauthorizedException();
    }
    const current = this.agreementsService.getCurrentVersions();
    const needsAgreementsAcceptance =
      full.acceptedTermsVersion == null ||
      full.acceptedPrivacyPolicyVersion == null ||
      (current.termsVersion != null && full.acceptedTermsVersion !== current.termsVersion) ||
      (current.privacyPolicyVersion != null && full.acceptedPrivacyPolicyVersion !== current.privacyPolicyVersion);
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
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('accept-agreements')
  @UseGuards(JwtAuthGuard)
  async acceptAgreements(@GetUser() user: JwtUser): Promise<{ user: AuthResponse['user'] }> {
    return this.authService.acceptAgreements(user.id);
  }

  @Get('company')
  @UseGuards(JwtAuthGuard)
  async getMyCompany(@GetUser() user: JwtUser) {
    const company = await this.authService.getMyCompany(user.id);
    return { company };
  }

  @Post('company/link')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  async linkCompany(
    @GetUser() user: JwtUser,
    @Body() dto: LinkCompanyDto,
  ) {
    return this.authService.linkCompanyByNip(user.id, dto.nip);
  }

  @Post('company/refresh')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  async refreshCompany(@GetUser() user: JwtUser) {
    return this.authService.refreshCompany(user.id);
  }
}
