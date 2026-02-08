import { Body, Controller, Get, Patch, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Request } from 'express';
import { AuthService, AuthResponse } from './auth.service';
import { GetUser } from './get-user.decorator';
import type { JwtUser } from './get-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
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
  async getProfile(@GetUser() user: JwtUser): Promise<{ user: AuthResponse['user'] }> {
    const full = await this.authService.validateUser({ sub: user.id, email: user.email });
    if (!full) {
      throw new UnauthorizedException();
    }
    return { user: full };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @GetUser() user: JwtUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ user: AuthResponse['user'] }> {
    return this.authService.updateProfile(user.id, dto);
  }
}
