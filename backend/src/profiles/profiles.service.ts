import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { slugFromName } from '../common/slug.helper';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { I18nService } from '../i18n/i18n.service';
import type { SupportedLanguage } from '../i18n/i18n.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
    private readonly i18nService: I18nService,
  ) {}

  /**
   * Check if slug is available (no other profile uses it, or only the excluded one).
   * Returns { available: true } if slug can be used.
   */
  async checkSlugAvailability(
    slug: string,
    excludeProfileId?: string,
  ): Promise<{ available: boolean }> {
    const normalized = slugFromName(slug.trim(), '');
    if (normalized.length < 2) {
      return { available: false };
    }
    const existing = await this.prisma.profile.findUnique({
      where: { slug: normalized },
    });
    const available = !existing || existing.id === excludeProfileId;
    return { available };
  }

  /** Ensure unique slug: if slug exists, append -2, -3, etc. */
  private async ensureUniqueSlug(
    baseSlug: string,
    excludeProfileId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await this.prisma.profile.findUnique({
        where: { slug },
      });
      if (!existing || existing.id === excludeProfileId) return slug;
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
  }

  async create(ownerId: string, dto: CreateProfileDto) {
    const existing = await this.prisma.profile.findFirst({
      where: { ownerId },
    });
    if (existing) {
      throw new ConflictException('errors.profileOnlyOne');
    }

    const baseSlug = dto.slug?.trim().toLowerCase() || slugFromName(dto.name, 'profile');
    const slug = await this.ensureUniqueSlug(baseSlug);

    if (dto.locationId) {
      const location = await this.prisma.location.findUnique({
        where: { id: dto.locationId },
      });
      if (!location) {
        throw new NotFoundException('errors.locationNotFound');
      }
    }

    const profile = await this.prisma.profile.create({
      data: {
        name: dto.name.trim(),
        slug,
        website: dto.website?.trim() || null,
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
        aboutUs: dto.aboutUs?.trim() || null,
        locationId: dto.locationId || null,
        ownerId,
      },
      include: {
        location: true,
        owner: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });
    return this.withResolvedCoverUrl(profile);
  }

  private async withResolvedCoverUrl<
    T extends { coverPhotoUrl: string | null },
  >(profile: T): Promise<T> {
    const resolved =
      await this.storageService.getImageUrlForResponse(profile.coverPhotoUrl);
    return { ...profile, coverPhotoUrl: resolved };
  }

  /**
   * Public list of verified profiles (visiting cards) with pagination.
   * When isAdmin is true, returns all profiles (including unverified) with rejectedAt and rejectedReason for UI.
   */
  async findAllVerified(
    page = 1,
    limit = 24,
    isAdmin = false,
  ) {
    const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));
    const take = Math.min(50, Math.max(1, limit));
    const where = isAdmin ? {} : { isVerified: true };

    const [items, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        include: {
          location: true,
          owner: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      this.prisma.profile.count({ where }),
    ]);

    const itemsWithCover = await Promise.all(
      items.map((p) => this.withResolvedCoverUrl(p)),
    );
    return { items: itemsWithCover, total };
  }

  /** Count profiles that are not yet verified (for admin banner). Admin only. */
  async countPendingForAdmin(isAdmin: boolean): Promise<{ count: number }> {
    if (!isAdmin) return { count: 0 };
    const count = await this.prisma.profile.count({
      where: { isVerified: false },
    });
    return { count };
  }

  async findMyProfiles(ownerId: string) {
    const list = await this.prisma.profile.findMany({
      where: { ownerId },
      include: {
        location: true,
        owner: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(list.map((p) => this.withResolvedCoverUrl(p)));
  }

  /** Get profile by slug. Public: only if isVerified. Owner or admin can see unverified. */
  async findBySlug(slug: string, requestUserId?: string, isAdmin?: boolean) {
    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      include: {
        location: true,
        owner: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('errors.profileNotFound');
    const isOwner = requestUserId === profile.ownerId;
    if (!profile.isVerified && !isOwner && !isAdmin) {
      throw new NotFoundException('errors.profileNotFound');
    }
    return this.withResolvedCoverUrl(profile);
  }

  async findById(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        location: true,
        owner: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('errors.profileNotFound');
    return this.withResolvedCoverUrl(profile);
  }

  async update(
    id: string,
    userId: string,
    isAdmin: boolean,
    dto: UpdateProfileDto,
  ) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('errors.profileNotFound');
    if (profile.ownerId !== userId && !isAdmin) {
      throw new ForbiddenException('errors.profileUpdateForbidden');
    }

    if (dto.locationId !== undefined && dto.locationId) {
      const location = await this.prisma.location.findUnique({
        where: { id: dto.locationId },
      });
      if (!location) throw new NotFoundException('errors.locationNotFound');
    }

    const name = dto.name !== undefined ? dto.name.trim() : profile.name;
    let slug = profile.slug;
    if (dto.slug !== undefined) {
      const normalized = slugFromName(dto.slug.trim(), '');
      if (!normalized) {
        throw new BadRequestException('validation.profileSlugInvalid');
      }
      const existing = await this.prisma.profile.findUnique({
        where: { slug: normalized },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('validation.profileSlugTaken');
      }
      slug = normalized;
    } else if (dto.name !== undefined && dto.name.trim() !== profile.name) {
      const baseSlug = slugFromName(dto.name, 'profile');
      slug = await this.ensureUniqueSlug(baseSlug, id);
    }

    const data: Prisma.ProfileUpdateInput = {
      ...(dto.name !== undefined && { name }),
      slug,
      ...(dto.website !== undefined && {
        website: dto.website?.trim() || null,
      }),
      ...(dto.email !== undefined && { email: dto.email?.trim() || null }),
      ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
      ...(dto.aboutUs !== undefined && {
        aboutUs: dto.aboutUs?.trim() || null,
      }),
      ...(dto.locationId !== undefined && {
        locationId: dto.locationId || null,
      }),
      ...(dto.coverPhotoUrl !== undefined && {
        coverPhotoUrl: dto.coverPhotoUrl?.trim() || null,
      }),
    };
    // When owner edits after rejection, clear rejection so profile goes back to pending
    if (profile.rejectedAt != null || profile.rejectedReason != null) {
      data.rejectedAt = null;
      data.rejectedReason = null;
    }
    const updated = await this.prisma.profile.update({
      where: { id },
      data,
      include: {
        location: true,
        owner: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });
    return this.withResolvedCoverUrl(updated);
  }

  async uploadCover(
    id: string,
    userId: string,
    isAdmin: boolean,
    buffer: Buffer,
  ) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('errors.profileNotFound');
    if (profile.ownerId !== userId && !isAdmin) {
      throw new ForbiddenException('errors.profileUpdateForbidden');
    }
    if (!this.storageService.isConfigured()) {
      throw new BadRequestException('Cover upload is not configured');
    }
    if (profile.coverPhotoUrl) {
      await this.storageService.deleteCoverPhoto(profile.coverPhotoUrl);
    }
    const coverPhotoUrl = await this.storageService.uploadCoverPhoto(
      buffer,
      id,
    );
    if (!coverPhotoUrl) {
      throw new BadRequestException('Failed to upload cover');
    }
    const updated = await this.prisma.profile.update({
      where: { id },
      data: { coverPhotoUrl },
      include: {
        location: true,
        owner: { select: { id: true, name: true, surname: true } },
      },
    });
    return this.withResolvedCoverUrl(updated);
  }

  async removeCover(id: string, userId: string, isAdmin: boolean) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('errors.profileNotFound');
    if (profile.ownerId !== userId && !isAdmin) {
      throw new ForbiddenException('errors.profileUpdateForbidden');
    }
    if (profile.coverPhotoUrl) {
      await this.storageService.deleteCoverPhoto(profile.coverPhotoUrl);
    }
    return this.prisma.profile
      .update({
        where: { id },
        data: { coverPhotoUrl: null },
        include: {
          location: true,
          owner: { select: { id: true, name: true, surname: true } },
        },
      })
      .then((p) => this.withResolvedCoverUrl(p));
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('errors.profileNotFound');
    if (profile.ownerId !== userId && !isAdmin) {
      throw new ForbiddenException('errors.profileDeleteForbidden');
    }
    await this.prisma.profile.delete({ where: { id } });
  }

  async verify(id: string, isAdmin: boolean) {
    if (!isAdmin) throw new ForbiddenException('errors.profileVerifyAdminOnly');
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        location: true,
        owner: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            language: true,
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('errors.profileNotFound');
    const updated = await this.prisma.profile.update({
      where: { id },
      data: {
        isVerified: true,
        rejectedAt: null,
        rejectedReason: null,
      },
      include: {
        location: true,
        owner: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    // Send acceptance email to owner
    const owner = profile.owner as { email: string; language?: string } | null;
    if (owner?.email && this.emailService.isConfigured()) {
      const lang: SupportedLanguage =
        owner.language === 'ENGLISH' ? 'en' : 'pl';
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      const profileUrl = `${frontendUrl}/company/${profile.slug}`;
      const subject = this.i18nService.translate(
        'messages.profileAcceptedEmailSubject',
        lang,
      );
      const intro = this.i18nService.translate(
        'messages.profileAcceptedEmailIntro',
        lang,
        { name: profile.name },
      );
      const cta = this.i18nService.translate(
        'messages.profileAcceptedEmailCta',
        lang,
      );
      const html = `
        <p>${intro}</p>
        <p><a href="${profileUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">${cta}</a></p>
        <p>Hoplo</p>
      `;
      const text = `${subject}\n\n${intro}\n\n${cta}: ${profileUrl}`;
      await this.emailService.sendHtml(owner.email, subject, html, { text });
    }

    return this.withResolvedCoverUrl(updated);
  }

  /** Reject a profile (admin only). Sends email to owner with reason. */
  async reject(id: string, isAdmin: boolean, reason: string) {
    if (!isAdmin) throw new ForbiddenException('errors.profileVerifyAdminOnly');
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        location: true,
        owner: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            language: true,
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('errors.profileNotFound');
    const now = new Date();
    const updated = await this.prisma.profile.update({
      where: { id },
      data: {
        isVerified: false,
        rejectedAt: now,
        rejectedReason: reason.trim(),
      },
      include: {
        location: true,
        owner: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    });

    // Send rejection email to owner
    const owner = profile.owner as { email: string; language?: string } | null;
    if (owner?.email && this.emailService.isConfigured()) {
      const lang: SupportedLanguage =
        owner.language === 'ENGLISH' ? 'en' : 'pl';
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      const editUrl = `${frontendUrl}/profile/business-profile`;
      const subject = this.i18nService.translate(
        'messages.profileRejectedEmailSubject',
        lang,
      );
      const intro = this.i18nService.translate(
        'messages.profileRejectedEmailIntro',
        lang,
        { name: profile.name },
      );
      const reasonLabel = this.i18nService.translate(
        'messages.profileRejectedEmailReason',
        lang,
      );
      const cta = this.i18nService.translate(
        'messages.profileRejectedEmailCta',
        lang,
      );
      const outro = this.i18nService.translate(
        'messages.profileRejectedEmailOutro',
        lang,
      );
      const escapedReason = reason
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      const html = `
        <p>${intro}</p>
        <p><strong>${reasonLabel}:</strong></p>
        <p>${escapedReason}</p>
        <p><a href="${editUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">${cta}</a></p>
        <p>${outro}</p>
        <p>Hoplo</p>
      `;
      const text = `${subject}\n\n${intro}\n\n${reasonLabel}: ${reason.trim()}\n\n${cta}: ${editUrl}\n\n${outro}`;
      await this.emailService.sendHtml(owner.email, subject, html, { text });
    }

    return this.withResolvedCoverUrl(updated);
  }
}
