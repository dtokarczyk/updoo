import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AgreementsService } from '../agreements/agreements.service';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import type { AuthResponseUser } from '../auth/auth.types';

@Injectable()
export class AccountService {
  private readonly saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly agreementsService: AgreementsService,
    private readonly authService: AuthService,
  ) {}

  /** Load current user with resolved avatar URL for API response. */
  async getUserForResponse(userId: string): Promise<AuthResponseUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
    const resolvedAvatarUrl =
      await this.storageService.getImageUrlForResponse(user.avatarUrl ?? null);
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
      skills: skillsFromUser.map((r) => ({
        id: r.skill.id,
        name: r.skill.name,
      })),
      hasPassword: !!user.password,
      acceptedTermsVersion: user.acceptedTermsVersion,
      acceptedPrivacyPolicyVersion: user.acceptedPrivacyPolicyVersion,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ user: AuthResponseUser }> {
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
      ...(dto.avatarUrl !== undefined && {
        avatarUrl: dto.avatarUrl?.trim() || null,
      }),
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
    const updated = await this.getUserForResponse(user.id);
    if (!updated) {
      throw new UnauthorizedException('Invalid user');
    }
    return { user: updated };
  }

  /** Remove user avatar from storage and set avatarUrl to null. */
  async removeAvatar(userId: string): Promise<{ user: AuthResponseUser }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });
    const avatarUrl = user?.avatarUrl ?? null;
    if (avatarUrl) {
      await this.storageService.deleteAvatar(avatarUrl);
    }
    return this.updateProfile(userId, { avatarUrl: '' });
  }

  /** Accept current terms and privacy policy. */
  async acceptAgreements(userId: string): Promise<{ user: AuthResponseUser }> {
    const current = this.agreementsService.getCurrentVersions();
    const acceptedAt = new Date();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        acceptedTermsVersion: current.termsVersion ?? 'none',
        acceptedTermsAt: acceptedAt,
        acceptedPrivacyPolicyVersion: current.privacyPolicyVersion ?? 'none',
        acceptedPrivacyPolicyAt: acceptedAt,
      },
    });
    const user = await this.getUserForResponse(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }
    return { user };
  }
}
