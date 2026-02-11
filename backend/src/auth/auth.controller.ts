import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Request } from 'express';
import { AuthService, AuthResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { I18nService, SupportedLanguage } from '../i18n/i18n.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18nService: I18nService,
  ) {}

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
    res.redirect(
      `${frontendUrl}/login/callback?token=${encodeURIComponent(auth.access_token)}`,
    );
  }
}
