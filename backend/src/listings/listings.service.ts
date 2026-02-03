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
        currency: dto.currency.toUpperCase().slice(0, 3),
        experienceLevel: dto.experienceLevel as ExperienceLevel,
        locationId: dto.locationId || null,
        isRemote: dto.isRemote,
        projectType: dto.projectType as ProjectType,
      },
      include: {
        category: true,
        author: { select: { id: true, email: true, name: true } },
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
        author: { select: { id: true, email: true, name: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
  }

  /** Feed: published for everyone; when userId is set, also include that user's draft listings. */
  async getFeed(take = 50, cursor?: string, userId?: string) {
    const where = userId
      ? { OR: [{ status: ListingStatus.PUBLISHED }, { status: ListingStatus.DRAFT, authorId: userId }] }
      : { status: ListingStatus.PUBLISHED };
    const listings = await this.prisma.listing.findMany({
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        author: { select: { id: true, email: true, name: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    const hasMore = listings.length > take;
    const items = hasMore ? listings.slice(0, take) : listings;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;
    return { items, nextCursor };
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
        author: { select: { id: true, email: true, name: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
  }
}
