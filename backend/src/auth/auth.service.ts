import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AgreementsService } from '../agreements/agreements.service';
import { StorageService } from '../storage/storage.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { I18nService, SupportedLanguage } from '../i18n/i18n.service';
import type { JwtPayload, AuthResponseUser, AuthResponse } from './auth.types';
import { PASSWORD_RESET_EXPIRY_HOURS } from './constants';

export type { JwtPayload, AuthResponseUser, AuthResponse };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly agreementsService: AgreementsService,
    private readonly i18nService: I18nService,
    private readonly storageService: StorageService,
  ) {}

  /** Short-lived JWT for avatar proxy URL (GET /auth/avatar?token=...). */
  private signAvatarToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, purpose: 'avatar' },
      { expiresIn: '1h' },
    );
  }

  /**
   * Resolve avatar URL for API response. When proxy is used (path or base URL set), returns
   * a link to avatar that works with the profile – relative path (e.g. /api/auth/avatar?token=...)
   * or full URL. Otherwise returns presigned URL for private buckets.
   * Exposed for AccountService and JWT user building.
   */
  async resolveAvatarUrlForResponse(
    userId: string,
    avatarUrl: string | null,
  ): Promise<string | null> {
    if (!avatarUrl) return null;
    const presigned =
      await this.storageService.getPresignedAvatarUrl(avatarUrl);
    if (!presigned || presigned === avatarUrl) return presigned ?? avatarUrl;

    const token = this.signAvatarToken(userId);
    const pathSuffix = `/auth/avatar?token=${encodeURIComponent(token)}`;

    const pathPrefix = process.env.AVATAR_PATH_PREFIX ?? process.env.API_PATH;
    if (pathPrefix != null && pathPrefix !== '') {
      const base = pathPrefix.replace(/\/$/, '');
      return base ? `${base}${pathSuffix}` : pathSuffix;
    }

    const baseUrl = process.env.BACKEND_PUBLIC_URL ?? process.env.API_URL;
    if (baseUrl) {
      return `${baseUrl.replace(/\/$/, '')}${pathSuffix}`;
    }

    return presigned ?? avatarUrl;
  }

  /**
   * Request password reset: find user by email (must have password), generate token,
   * save expiry, send email with reset link. Always returns success to avoid email enumeration.
   */
  async requestPasswordReset(
    dto: ForgotPasswordDto,
    lang: SupportedLanguage,
  ): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    const successMessage = this.i18nService.translate(
      'messages.forgotPasswordSuccess',
      lang,
    );
    if (!user || !user.password) {
      return { message: successMessage };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/login/reset-password?token=${encodeURIComponent(token)}`;

    const subject = this.i18nService.translate(
      'messages.forgotPasswordEmailSubject',
      lang,
    );
    const intro = this.i18nService.translate(
      'messages.forgotPasswordEmailIntro',
      lang,
      {
        email: escapeHtml(email),
      },
    );
    const cta = this.i18nService.translate(
      'messages.forgotPasswordEmailCta',
      lang,
    );
    const expiry = this.i18nService.translate(
      'messages.forgotPasswordEmailExpiry',
      lang,
      {
        hours: String(PASSWORD_RESET_EXPIRY_HOURS),
      },
    );
    const html = `
      <p>${intro}</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">${cta}</a></p>
      <p>${expiry}</p>
      <p>Hoplo</p>
    `;
    const text = `${subject}: ${resetUrl}\n\n${expiry}`;

    if (this.emailService.isConfigured()) {
      await this.emailService.sendHtml(user.email, subject, html, { text });
    }

    return { message: successMessage };
  }

  async resetPassword(
    dto: ResetPasswordDto,
    lang: SupportedLanguage,
  ): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        token: dto.token,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, this.saltRounds);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.delete({ where: { id: resetRecord.id } }),
    ]);

    const message = this.i18nService.translate(
      'messages.resetPasswordSuccess',
      lang,
    );
    return { message };
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    if (!dto.termsAccepted) {
      throw new BadRequestException(
        'Terms and privacy policy must be accepted',
      );
    }
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const { termsVersion, privacyPolicyVersion } =
      this.agreementsService.getCurrentVersions();
    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        acceptedTermsVersion: termsVersion ?? undefined,
        acceptedPrivacyPolicyVersion: privacyPolicyVersion ?? undefined,
      },
    });
    const withRelations = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        company: true,

        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    if (!withRelations) {
      return this.buildAuthResponseAsync({
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        avatarUrl: user.avatarUrl ?? null,
        phone: user.phone,
        nipCompany: null,
        companyId: user.companyId ?? null,
        companySize: null,
        accountType: user.accountType,
        language: user.language,
        defaultMessage: user.defaultMessage,
        skills: [],
        hasPassword: !!user.password,
        acceptedTermsVersion: user.acceptedTermsVersion,
        acceptedPrivacyPolicyVersion: user.acceptedPrivacyPolicyVersion,
      });
    }
    const skillsFromUser =
      (
        withRelations as unknown as {
          skills?: { skill: { id: string; name: string } }[];
        }
      ).skills ?? [];
    const withRelationsCompany = withRelations as {
      company?: { nip: string; companySize: string | null } | null;
    };
    return this.buildAuthResponseAsync({
      id: withRelations.id,
      email: withRelations.email,
      name: withRelations.name,
      surname: withRelations.surname,
      avatarUrl: withRelations.avatarUrl ?? null,
      phone: withRelations.phone,
      nipCompany: withRelationsCompany.company?.nip ?? null,
      companyId: withRelations.companyId ?? null,
      companySize: withRelationsCompany.company?.companySize ?? null,
      accountType: withRelations.accountType,
      language: withRelations.language,
      defaultMessage: withRelations.defaultMessage,
      skills: skillsFromUser.map((relation) => ({
        id: relation.skill.id,
        name: relation.skill.name,
      })),
      hasPassword: !!withRelations.password,
      acceptedTermsVersion: withRelations.acceptedTermsVersion,
      acceptedPrivacyPolicyVersion: withRelations.acceptedPrivacyPolicyVersion,
    });
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        company: true,

        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const skillsFromUser =
      (
        user as unknown as {
          skills?: { skill: { id: string; name: string } }[];
        }
      ).skills ?? [];
    const userCompany = user as {
      company?: { nip: string; companySize: string | null } | null;
    };
    return this.buildAuthResponseAsync({
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      avatarUrl: user.avatarUrl ?? null,
      phone: user.phone,
      nipCompany: userCompany.company?.nip ?? null,
      companyId: user.companyId ?? null,
      companySize: userCompany.company?.companySize ?? null,
      accountType: user.accountType,
      language: user.language,
      defaultMessage: user.defaultMessage,
      skills: skillsFromUser.map((relation) => ({
        id: relation.skill.id,
        name: relation.skill.name,
      })),
      hasPassword: true,
      acceptedTermsVersion: user.acceptedTermsVersion,
      acceptedPrivacyPolicyVersion: user.acceptedPrivacyPolicyVersion,
    });
  }

  async loginOrCreateFromGoogle(profile: {
    id: string;
    emails?: { value: string; verified?: boolean }[];
    displayName?: string;
    name?: { givenName?: string; familyName?: string };
  }): Promise<AuthResponse> {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) {
      throw new BadRequestException('Google profile has no email');
    }
    const googleId = profile.id;
    const name =
      profile.name?.givenName ?? profile.displayName?.split(' ')[0] ?? null;
    const surname =
      profile.name?.familyName ??
      (profile.displayName?.split(' ').slice(1).join(' ') || null);

    let user = await this.prisma.user.findUnique({
      where: { googleId },
      include: {
        company: true,

        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    if (user) {
      const skillsFromUser =
        (
          user as unknown as {
            skills?: { skill: { id: string; name: string } }[];
          }
        ).skills ?? [];
      const userCompany = user as {
        company?: { nip: string; companySize: string | null } | null;
      };
      return this.buildAuthResponseAsync({
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        avatarUrl: user.avatarUrl ?? null,
        phone: user.phone,
        nipCompany: userCompany.company?.nip ?? null,
        companyId: user.companyId ?? null,
        companySize: userCompany.company?.companySize ?? null,
        accountType: user.accountType,
        language: user.language,
        defaultMessage: user.defaultMessage,
        skills: skillsFromUser.map((r) => ({
          id: r.skill.id,
          name: r.skill.name,
        })),
        hasPassword: !!user.password,
        acceptedTermsVersion: user.acceptedTermsVersion,
        acceptedPrivacyPolicyVersion: user.acceptedPrivacyPolicyVersion,
      });
    }

    user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        company: true,

        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
      const skillsFromUser =
        (
          user as unknown as {
            skills?: { skill: { id: string; name: string } }[];
          }
        ).skills ?? [];
      const userCompany = user as {
        company?: { nip: string; companySize: string | null } | null;
      };
      return this.buildAuthResponseAsync({
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        avatarUrl: user.avatarUrl ?? null,
        phone: user.phone,
        nipCompany: userCompany.company?.nip ?? null,
        companyId: user.companyId ?? null,
        companySize: userCompany.company?.companySize ?? null,
        accountType: user.accountType,
        language: user.language,
        defaultMessage: user.defaultMessage,
        skills: skillsFromUser.map((r) => ({
          id: r.skill.id,
          name: r.skill.name,
        })),
        hasPassword: !!user.password,
        acceptedTermsVersion: user.acceptedTermsVersion,
        acceptedPrivacyPolicyVersion: user.acceptedPrivacyPolicyVersion,
      });
    }

    const newUser = await this.prisma.user.create({
      data: {
        email,
        googleId,
        name,
        surname,
      },
    });
    const withRelations = await this.prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        company: true,

        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    if (!withRelations) {
      return this.buildAuthResponseAsync({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        surname: newUser.surname,
        avatarUrl: newUser.avatarUrl ?? null,
        phone: newUser.phone,
        nipCompany: null,
        companyId: newUser.companyId ?? null,
        companySize: null,
        accountType: newUser.accountType,
        language: newUser.language,
        defaultMessage: newUser.defaultMessage,
        skills: [],
        hasPassword: false,
        acceptedTermsVersion: newUser.acceptedTermsVersion,
        acceptedPrivacyPolicyVersion: newUser.acceptedPrivacyPolicyVersion,
      });
    }
    const skillsFromUser =
      (
        withRelations as unknown as {
          skills?: { skill: { id: string; name: string } }[];
        }
      ).skills ?? [];
    const newUserCompany = withRelations as {
      company?: { nip: string; companySize: string | null } | null;
    };
    return this.buildAuthResponseAsync({
      id: withRelations.id,
      email: withRelations.email,
      name: withRelations.name,
      surname: withRelations.surname,
      avatarUrl: withRelations.avatarUrl ?? null,
      phone: withRelations.phone,
      nipCompany: newUserCompany.company?.nip ?? null,
      companyId: withRelations.companyId ?? null,
      companySize: newUserCompany.company?.companySize ?? null,
      accountType: withRelations.accountType,
      language: withRelations.language,
      defaultMessage: withRelations.defaultMessage,
      skills: skillsFromUser.map((r) => ({
        id: r.skill.id,
        name: r.skill.name,
      })),
      hasPassword: !!withRelations.password,
      acceptedTermsVersion: withRelations.acceptedTermsVersion,
      acceptedPrivacyPolicyVersion: withRelations.acceptedPrivacyPolicyVersion,
    });
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        company: true,

        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    if (!user) return null;
    const skillsFromUser =
      (
        user as unknown as {
          skills?: { skill: { id: string; name: string } }[];
        }
      ).skills ?? [];
    const userCompany = user as {
      company?: { nip: string; companySize: string | null } | null;
    };
    const resolvedAvatarUrl = await this.resolveAvatarUrlForResponse(
      user.id,
      user.avatarUrl ?? null,
    );
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      avatarUrl: resolvedAvatarUrl ?? user.avatarUrl ?? null,
      phone: user.phone,
      nipCompany: userCompany.company?.nip ?? null,
      companyId: user.companyId ?? null,
      companySize: userCompany.company?.companySize ?? null,
      accountType: user.accountType,
      language: user.language,
      defaultMessage: user.defaultMessage,
      skills: skillsFromUser.map((relation) => ({
        id: relation.skill.id,
        name: relation.skill.name,
      })),
      hasPassword: !!user.password,
      acceptedTermsVersion: user.acceptedTermsVersion,
      acceptedPrivacyPolicyVersion: user.acceptedPrivacyPolicyVersion,
    };
  }

  private buildAuthResponse(user: AuthResponseUser): AuthResponse {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        nipCompany: user.nipCompany,
        companyId: user.companyId,
        companySize: user.companySize ?? null,
        accountType: user.accountType,
        language: user.language,
        defaultMessage: user.defaultMessage,
        skills: user.skills,
        hasPassword: user.hasPassword,
        acceptedTermsVersion: user.acceptedTermsVersion,
        acceptedPrivacyPolicyVersion: user.acceptedPrivacyPolicyVersion,
      },
    };
  }

  private async buildAuthResponseAsync(
    user: AuthResponseUser,
  ): Promise<AuthResponse> {
    // Skip resolution if avatarUrl is already our proxy URL (avoid infinite recursion)
    const isProxyUrl =
      user.avatarUrl != null && user.avatarUrl.includes('/auth/avatar?token=');
    const resolvedAvatarUrl = isProxyUrl
      ? user.avatarUrl
      : await this.resolveAvatarUrlForResponse(user.id, user.avatarUrl ?? null);
    return this.buildAuthResponse({
      ...user,
      avatarUrl: resolvedAvatarUrl ?? user.avatarUrl ?? null,
    });
  }
}
