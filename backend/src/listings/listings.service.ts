import { ForbiddenException, Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { BillingType, HoursPerWeek, ExperienceLevel, ProjectType, ListingStatus } from '@prisma/client';

const DEFAULT_CATEGORIES = [
  { name: 'Usługi', slug: 'uslugi' },
  { name: 'Sprzedaż', slug: 'sprzedaz' },
  { name: 'Praca', slug: 'praca' },
  { name: 'Nieruchomości', slug: 'nieruchomosci' },
  { name: 'Motoryzacja', slug: 'motoryzacja' },
  { name: 'Inne', slug: 'inne' },
];

const DEFAULT_LOCATIONS = [
  { name: 'Warszawa', slug: 'warszawa' },
  { name: 'Kraków', slug: 'krakow' },
  { name: 'Wrocław', slug: 'wroclaw' },
  { name: 'Poznań', slug: 'poznan' },
  { name: 'Gdańsk', slug: 'gdansk' },
  { name: 'Łódź', slug: 'lodz' },
  { name: 'Katowice', slug: 'katowice' },
  { name: 'Lublin', slug: 'lublin' },
  { name: 'Bydgoszcz', slug: 'bydgoszcz' },
  { name: 'Szczecin', slug: 'szczecin' },
  { name: 'Remote', slug: 'remote' },
];

const DEFAULT_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'C#',
  '.NET',
  'PHP',
  'SQL',
  'HTML/CSS',
  'Angular',
  'Vue.js',
  'GraphQL',
  'REST API',
];

@Injectable()
export class ListingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) { }

  async onModuleInit() {
    await this.ensureCategories();
    await this.ensureLocations();
    await this.ensureSkills();
  }

  private async ensureCategories() {
    const count = await this.prisma.category.count();
    if (count === 0) {
      await this.prisma.category.createMany({ data: DEFAULT_CATEGORIES });
    }
  }

  private async ensureLocations() {
    const count = await this.prisma.location.count();
    if (count === 0) {
      await this.prisma.location.createMany({ data: DEFAULT_LOCATIONS });
    }
  }

  private async ensureSkills() {
    const count = await this.prisma.skill.count();
    if (count === 0) {
      await this.prisma.skill.createMany({
        data: DEFAULT_SKILLS.map((name) => ({ name })),
      });
    }
  }

  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getLocations() {
    return this.prisma.location.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getSkills() {
    return this.prisma.skill.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createListing(authorId: string, accountType: string | null, dto: CreateListingDto) {
    if (accountType !== 'CLIENT') {
      throw new ForbiddenException('Tylko klienci mogą tworzyć ogłoszenia');
    }
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (dto.locationId) {
      const location = await this.prisma.location.findUnique({
        where: { id: dto.locationId },
      });
      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }
    const skillIdsToLink = new Set<string>(dto.skillIds ?? []);
    if (dto.newSkillNames?.length) {
      for (const name of dto.newSkillNames) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        const existing = await this.prisma.skill.findUnique({
          where: { name: trimmed },
        });
        if (existing) {
          skillIdsToLink.add(existing.id);
        } else {
          const created = await this.prisma.skill.create({
            data: { name: trimmed },
          });
          skillIdsToLink.add(created.id);
        }
      }
    }
    if (skillIdsToLink.size > 0) {
      const skillsExist = await this.prisma.skill.findMany({
        where: { id: { in: [...skillIdsToLink] } },
        select: { id: true },
      });
      const foundIds = new Set(skillsExist.map((s) => s.id));
      for (const id of skillIdsToLink) {
        if (!foundIds.has(id)) {
          throw new NotFoundException(`Skill not found: ${id}`);
        }
      }
    }
    const now = new Date();
    const allowedDays = [7, 14, 21, 30];
    const deadline =
      dto.offerDays != null && allowedDays.includes(dto.offerDays)
        ? new Date(now.getTime() + dto.offerDays * 24 * 60 * 60 * 1000)
        : null;
    const listing = await this.prisma.listing.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        authorId,
        status: ListingStatus.DRAFT,
        billingType: dto.billingType as BillingType,
        hoursPerWeek: dto.billingType === 'HOURLY' && dto.hoursPerWeek
          ? (dto.hoursPerWeek as HoursPerWeek)
          : null,
        rate: dto.rate,
        rateNegotiable: dto.rateNegotiable ?? false,
        currency: dto.currency.toUpperCase().slice(0, 3),
        experienceLevel: dto.experienceLevel as ExperienceLevel,
        locationId: dto.locationId || null,
        isRemote: dto.isRemote,
        projectType: dto.projectType as ProjectType,
        deadline,
      },
      include: {
        category: true,
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    if (skillIdsToLink.size > 0) {
      await this.prisma.listingSkill.createMany({
        data: [...skillIdsToLink].map((skillId) => ({
          listingId: listing.id,
          skillId,
        })),
      });
    }
    return this.prisma.listing.findUnique({
      where: { id: listing.id },
      include: {
        category: true,
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
  }

  /** Feed: published for everyone; when userId is set, also include that user's draft listings. Optional categoryId filter. */
  async getFeed(take = 50, cursor?: string, userId?: string, categoryId?: string) {
    const statusWhere = userId
      ? { OR: [{ status: ListingStatus.PUBLISHED }, { status: ListingStatus.DRAFT, authorId: userId }] }
      : { status: ListingStatus.PUBLISHED };
    const where = categoryId
      ? { ...statusWhere, categoryId }
      : statusWhere;
    const listings = await this.prisma.listing.findMany({
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    const hasMore = listings.length > take;
    const items = hasMore ? listings.slice(0, take) : listings;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;
    return { items, nextCursor };
  }

  /** Get single listing by id. Author or ADMIN can read own/draft; others only published. */
  async getListing(listingId: string, userId?: string, isAdmin?: boolean) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        category: true,
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
        applications: {
          include: {
            freelancer: { select: { id: true, email: true, name: true, surname: true } },
          },
        },
      },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    const isAuthor = userId && listing.authorId === userId;
    if (listing.status === ListingStatus.DRAFT && !isAuthor && !isAdmin) {
      throw new NotFoundException('Listing not found');
    }
    const isAuthorOrAdmin = isAuthor || isAdmin;
    // Author/admin: full application data; others: only freelancer initials
    const applicationsForResponse = listing.applications.map((app) => {
      if (isAuthorOrAdmin) {
        return {
          id: app.id,
          freelancer: {
            id: app.freelancer.id,
            email: app.freelancer.email,
            name: app.freelancer.name,
            surname: app.freelancer.surname,
          },
          message: app.message ?? undefined,
          createdAt: app.createdAt,
        };
      }
      return {
        id: app.id,
        freelancerInitials: this.getInitials(app.freelancer.name, app.freelancer.surname),
        createdAt: app.createdAt,
      };
    });
    const currentUserApplied = Boolean(
      userId && listing.applications.some((a) => a.freelancerId === userId),
    );
    const { applications: _app, ...rest } = listing;
    return { ...rest, applications: applicationsForResponse, currentUserApplied };
  }

  private getInitials(name: string | null, surname: string | null): string {
    const n = (name?.trim() ?? '').charAt(0).toUpperCase();
    const s = (surname?.trim() ?? '').charAt(0).toUpperCase();
    if (n && s) return `${n}. ${s}.`;
    if (n) return `${n}.`;
    if (s) return `${s}.`;
    return '';
  }

  /** Freelancer applies to a listing. Allowed only before deadline. */
  async applyToListing(
    listingId: string,
    freelancerId: string,
    accountType: string | null,
    message?: string,
  ) {
    if (accountType !== 'FREELANCER') {
      throw new ForbiddenException('Tylko freelancerzy mogą zgłaszać się do ogłoszeń');
    }
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.status === ListingStatus.DRAFT) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.authorId === freelancerId) {
      throw new ForbiddenException('Nie możesz zgłosić się do własnego ogłoszenia');
    }
    const now = new Date();
    if (listing.deadline && listing.deadline < now) {
      throw new ForbiddenException('Termin zgłoszeń minął');
    }
    const trimmedMessage = message?.trim() || undefined;
    await this.prisma.listingApplication.upsert({
      where: {
        listingId_freelancerId: { listingId, freelancerId },
      },
      create: {
        listingId,
        freelancerId,
        message: trimmedMessage,
      },
      update: { message: trimmedMessage },
    });
    return { ok: true };
  }

  /** Update listing. Only author can update; status is always set to DRAFT so admin can re-approve. */
  async updateListing(listingId: string, userId: string, accountType: string | null, dto: CreateListingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.authorId !== userId) {
      throw new ForbiddenException('Możesz edytować tylko swoje ogłoszenia');
    }
    if (accountType !== 'CLIENT') {
      throw new ForbiddenException('Tylko klienci mogą edytować ogłoszenia');
    }
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (dto.locationId) {
      const location = await this.prisma.location.findUnique({
        where: { id: dto.locationId },
      });
      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }
    const skillIdsToLink = new Set<string>(dto.skillIds ?? []);
    if (dto.newSkillNames?.length) {
      for (const name of dto.newSkillNames) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        const existing = await this.prisma.skill.findUnique({
          where: { name: trimmed },
        });
        if (existing) {
          skillIdsToLink.add(existing.id);
        } else {
          const created = await this.prisma.skill.create({
            data: { name: trimmed },
          });
          skillIdsToLink.add(created.id);
        }
      }
    }
    if (skillIdsToLink.size > 0) {
      const skillsExist = await this.prisma.skill.findMany({
        where: { id: { in: [...skillIdsToLink] } },
        select: { id: true },
      });
      const foundIds = new Set(skillsExist.map((s) => s.id));
      for (const id of skillIdsToLink) {
        if (!foundIds.has(id)) {
          throw new NotFoundException(`Skill not found: ${id}`);
        }
      }
    }
    await this.prisma.listingSkill.deleteMany({
      where: { listingId },
    });
    const allowedDays = [7, 14, 21, 30];
    const newDeadline =
      dto.offerDays != null && allowedDays.includes(dto.offerDays)
        ? new Date(listing.createdAt.getTime() + dto.offerDays * 24 * 60 * 60 * 1000)
        : undefined;
    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        status: ListingStatus.DRAFT,
        billingType: dto.billingType as BillingType,
        hoursPerWeek: dto.billingType === 'HOURLY' && dto.hoursPerWeek
          ? (dto.hoursPerWeek as HoursPerWeek)
          : null,
        rate: dto.rate,
        rateNegotiable: dto.rateNegotiable ?? false,
        currency: dto.currency.toUpperCase().slice(0, 3),
        experienceLevel: dto.experienceLevel as ExperienceLevel,
        locationId: dto.locationId || null,
        isRemote: dto.isRemote,
        projectType: dto.projectType as ProjectType,
        ...(newDeadline != null && { deadline: newDeadline }),
      },
      include: {
        category: true,
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    if (skillIdsToLink.size > 0) {
      await this.prisma.listingSkill.createMany({
        data: [...skillIdsToLink].map((skillId) => ({
          listingId: updated.id,
          skillId,
        })),
      });
    }
    return this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        category: true,
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
  }

  async publishListing(listingId: string, adminUserId: string, isAdmin: boolean) {
    if (!isAdmin) {
      throw new ForbiddenException('Tylko użytkownik z typem konta ADMIN może publikować ogłoszenia');
    }
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return this.prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.PUBLISHED },
      include: {
        category: true,
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
  }
}
