import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AgreementsService } from '../agreements/agreements.service';
import { RegonService } from '../regon/regon.service';
import type { SearchResultRow } from '../regon/regon-contact.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { I18nService, SupportedLanguage } from '../i18n/i18n.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthResponseUser {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  phone: string | null;
  /** NIP from linked company (company.nip). */
  nipCompany: string | null;
  companyId: string | null;
  accountType: string | null;
  language: string;
  defaultMessage: string | null;
  skills: { id: string; name: string }[];
  /** False when user signed up with Google only and has not set a password yet. */
  hasPassword: boolean;
  /** Timestamp (version) of accepted terms of service, or null if not accepted. */
  acceptedTermsVersion: string | null;
  /** Timestamp (version) of accepted privacy policy, or null if not accepted. */
  acceptedPrivacyPolicyVersion: string | null;
}

export interface AuthResponse {
  access_token: string;
  user: AuthResponseUser;
}

const PASSWORD_RESET_EXPIRY_HOURS = 1;

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
    private readonly regonService: RegonService,
  ) {}

  /** Company payload returned by GET /auth/company and after link/refresh. */
  getCompanyPayload(company: {
    id: string;
    regon: string;
    nip: string;
    name: string;
    voivodeship: string | null;
    county: string | null;
    commune: string | null;
    locality: string | null;
    postalCode: string | null;
    street: string | null;
    propertyNumber: string | null;
    apartmentNumber: string | null;
    type: string | null;
    isActive: boolean;
    updatedAt: Date;
  }) {
    return {
      id: company.id,
      regon: company.regon,
      nip: company.nip,
      name: company.name,
      voivodeship: company.voivodeship,
      county: company.county,
      commune: company.commune,
      locality: company.locality,
      postalCode: company.postalCode,
      street: company.street,
      propertyNumber: company.propertyNumber,
      apartmentNumber: company.apartmentNumber,
      type: company.type,
      isActive: company.isActive,
      updatedAt: company.updatedAt,
    };
  }

  /** Map GUS search row to Company create/update payload. */
  private mapGusRowToCompany(row: SearchResultRow) {
    const nip = String(row.Nip ?? '').replace(/\s/g, '');
    const regon = String(row.Regon ?? '').replace(/\s/g, '');
    if (!nip || !regon) {
      throw new BadRequestException('GUS data missing NIP or REGON');
    }
    return {
      regon,
      nip,
      name: String(row.Nazwa ?? '').trim() || '—',
      voivodeship: row.Wojewodztwo?.trim() || null,
      county: row.Powiat?.trim() || null,
      commune: row.Gmina?.trim() || null,
      locality: row.Miejscowosc?.trim() || null,
      postalCode: row.KodPocztowy?.trim() || null,
      street: row.Ulica?.trim() || null,
      propertyNumber: row.NrNieruchomosci?.trim() || null,
      apartmentNumber: row.NrLokalu?.trim() || null,
      type: row.Typ?.trim() || null,
    };
  }

  /** Get current user's linked company. Returns null if none. */
  async getMyCompany(
    userId: string,
  ): Promise<ReturnType<AuthService['getCompanyPayload']> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!user?.companyId || !user.company) return null;
    return this.getCompanyPayload(user.company);
  }

  /** Link company to user by NIP: find in DB or fetch from GUS, create, then assign. */
  async linkCompanyByNip(
    userId: string,
    nipRaw: string,
  ): Promise<{
    user: AuthResponseUser;
    company: ReturnType<AuthService['getCompanyPayload']>;
  }> {
    const nip = String(nipRaw).replace(/\s/g, '').replace(/-/g, '');
    if (!/^\d{10}$/.test(nip)) {
      throw new BadRequestException('validation.nipInvalid');
    }

    let company = await this.prisma.company.findUnique({ where: { nip } });
    if (!company) {
      const gus = await this.regonService.getCompanyDataByNipRegonOrKrs(nip);
      if (!gus.searchResult.length) {
        throw new BadRequestException('messages.companyNotFoundInGus');
      }
      const data = this.mapGusRowToCompany(gus.searchResult[0]);
      company = await this.prisma.company.create({ data });
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id },
      include: {
        company: true,

        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    const skillsFromUser =
      (
        user as unknown as {
          skills?: { skill: { id: string; name: string } }[];
        }
      ).skills ?? [];
    const userCompany = user as { company?: { nip: string } | null };
    const authUser: AuthResponseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      phone: user.phone,
      nipCompany: userCompany.company?.nip ?? null,
      companyId: user.companyId ?? null,
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
    };
    return { user: authUser, company: this.getCompanyPayload(company) };
  }

  /** Refresh current user's company data from GUS. */
  async refreshCompany(
    userId: string,
  ): Promise<{ company: ReturnType<AuthService['getCompanyPayload']> }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!user?.companyId || !user.company) {
      throw new NotFoundException('messages.noCompanyLinked');
    }
    const gus = await this.regonService.getCompanyDataByNipRegonOrKrs(
      user.company.nip,
    );
    if (!gus.searchResult.length) {
      throw new BadRequestException('messages.companyNotFoundInGus');
    }
    const data = this.mapGusRowToCompany(gus.searchResult[0]);
    const company = await this.prisma.company.update({
      where: { id: user.company.id },
      data,
    });
    return { company: this.getCompanyPayload(company) };
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

  /**
   * Reset password using token from email. Validates token and expiry, then updates password.
   */
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
      return this.buildAuthResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        phone: user.phone,
        nipCompany: null,
        companyId: user.companyId ?? null,
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
      company?: { nip: string } | null;
    };
    return this.buildAuthResponse({
      id: withRelations.id,
      email: withRelations.email,
      name: withRelations.name,
      surname: withRelations.surname,
      phone: withRelations.phone,
      nipCompany: withRelationsCompany.company?.nip ?? null,
      companyId: withRelations.companyId ?? null,
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
    const userCompany = user as { company?: { nip: string } | null };
    return this.buildAuthResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      phone: user.phone,
      nipCompany: userCompany.company?.nip ?? null,
      companyId: user.companyId ?? null,
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

  /** Find or create user from Google OAuth profile; returns JWT + user. */
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
      const userCompany = user as { company?: { nip: string } | null };
      return this.buildAuthResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        phone: user.phone,
        nipCompany: userCompany.company?.nip ?? null,
        companyId: user.companyId ?? null,
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
      const userCompany = user as { company?: { nip: string } | null };
      return this.buildAuthResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        phone: user.phone,
        nipCompany: userCompany.company?.nip ?? null,
        companyId: user.companyId ?? null,
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
      return this.buildAuthResponse({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        surname: newUser.surname,
        phone: newUser.phone,
        nipCompany: null,
        companyId: newUser.companyId ?? null,
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
      company?: { nip: string } | null;
    };
    return this.buildAuthResponse({
      id: withRelations.id,
      email: withRelations.email,
      name: withRelations.name,
      surname: withRelations.surname,
      phone: withRelations.phone,
      nipCompany: newUserCompany.company?.nip ?? null,
      companyId: withRelations.companyId ?? null,
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

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ user: AuthResponse['user'] }> {
    if (dto.email !== undefined && dto.email.trim()) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const existing = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: userId },
        },
      });
      if (existing) {
        throw new ConflictException('User with this email already exists');
      }
    }
    const updateData: Parameters<typeof this.prisma.user.update>[0]['data'] = {
      ...(dto.name !== undefined && { name: dto.name || null }),
      ...(dto.surname !== undefined && { surname: dto.surname || null }),
      ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
      ...(dto.companyId !== undefined && {
        companyId: dto.companyId?.trim() || null,
      }),
      ...(dto.accountType !== undefined && {
        accountType: dto.accountType || null,
      }),
      ...(dto.email !== undefined &&
        dto.email.trim() && { email: dto.email.trim().toLowerCase() }),
      ...(dto.language !== undefined && { language: dto.language }),
      ...(dto.defaultMessage !== undefined && {
        defaultMessage: dto.defaultMessage || null,
      }),
    };
    if (dto.password !== undefined && dto.password.trim()) {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!existingUser) {
        throw new UnauthorizedException('Invalid user');
      }
      if (existingUser.password) {
        if (!dto.oldPassword || !dto.oldPassword.trim()) {
          throw new UnauthorizedException('Current password is required');
        }
        const isOldPasswordValid = await bcrypt.compare(
          dto.oldPassword.trim(),
          existingUser.password,
        );
        if (!isOldPasswordValid) {
          throw new UnauthorizedException('Current password is incorrect');
        }
      }
      updateData.password = await bcrypt.hash(
        dto.password.trim(),
        this.saltRounds,
      );
    }
    if (Array.isArray(dto.skillIds)) {
      (updateData as any).skills = {
        deleteMany: {},
        create: dto.skillIds.map((skillId) => ({ skillId })),
      };
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        company: true,

        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    const skillsFromUser =
      (
        user as unknown as {
          skills?: { skill: { id: string; name: string } }[];
        }
      ).skills ?? [];
    const userCompany = user as { company?: { nip: string } | null };
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        phone: user.phone,
        nipCompany: userCompany.company?.nip ?? null,
        companyId: user.companyId ?? null,
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
      },
    };
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
    const userCompany = user as { company?: { nip: string } | null };
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      phone: user.phone,
      nipCompany: userCompany.company?.nip ?? null,
      companyId: user.companyId ?? null,
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

  /** Accept current terms and privacy policy. Backend records current versions and acceptance timestamps. Uses 'none' when no document is configured. */
  async acceptAgreements(
    userId: string,
  ): Promise<{ user: AuthResponse['user'] }> {
    const current = this.agreementsService.getCurrentVersions();
    const acceptedAt = new Date();
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        acceptedTermsVersion: current.termsVersion ?? 'none',
        acceptedTermsAt: acceptedAt,
        acceptedPrivacyPolicyVersion: current.privacyPolicyVersion ?? 'none',
        acceptedPrivacyPolicyAt: acceptedAt,
      },
      include: {
        company: true,

        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    const skillsFromUser =
      (
        user as unknown as {
          skills?: { skill: { id: string; name: string } }[];
        }
      ).skills ?? [];
    const userCompany = user as { company?: { nip: string } | null };
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        phone: user.phone,
        nipCompany: userCompany.company?.nip ?? null,
        companyId: user.companyId ?? null,
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
      },
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
        phone: user.phone,
        nipCompany: user.nipCompany,
        companyId: user.companyId,
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
}
