import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { slugFromName } from '../common/slug.helper';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

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

    const baseSlug = slugFromName(dto.name, 'profile');
    const slug = await this.ensureUniqueSlug(baseSlug);

    if (dto.locationId) {
      const location = await this.prisma.location.findUnique({
        where: { id: dto.locationId },
      });
      if (!location) {
        throw new NotFoundException('errors.locationNotFound');
      }
    }

    return this.prisma.profile.create({
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
  }

  async findMyProfiles(ownerId: string) {
    return this.prisma.profile.findMany({
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
    return profile;
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
    return profile;
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
    if (dto.name !== undefined && dto.name.trim() !== profile.name) {
      const baseSlug = slugFromName(dto.name, 'profile');
      slug = await this.ensureUniqueSlug(baseSlug, id);
    }

    return this.prisma.profile.update({
      where: { id },
      data: {
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
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('errors.profileNotFound');
    return this.prisma.profile.update({
      where: { id },
      data: { isVerified: true },
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
  }
}
