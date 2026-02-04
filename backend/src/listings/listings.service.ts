import { ForbiddenException, Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FavoritesService } from './favorites.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { BillingType, HoursPerWeek, ExperienceLevel, ProjectType, ListingStatus, ListingLanguage } from '@prisma/client';

const DEFAULT_CATEGORIES = [
  { slug: 'programowanie', translations: [{ language: ListingLanguage.POLISH, name: 'Programowanie' }, { language: ListingLanguage.ENGLISH, name: 'Programming' }] },
  { slug: 'design', translations: [{ language: ListingLanguage.POLISH, name: 'Design' }, { language: ListingLanguage.ENGLISH, name: 'Design' }] },
  { slug: 'marketing', translations: [{ language: ListingLanguage.POLISH, name: 'Marketing' }, { language: ListingLanguage.ENGLISH, name: 'Marketing' }] },
  { slug: 'pisanie', translations: [{ language: ListingLanguage.POLISH, name: 'Pisanie' }, { language: ListingLanguage.ENGLISH, name: 'Writing' }] },
  { slug: 'prace-biurowe', translations: [{ language: ListingLanguage.POLISH, name: 'Prace biurowe' }, { language: ListingLanguage.ENGLISH, name: 'Office Work' }] },
  { slug: 'inne', translations: [{ language: ListingLanguage.POLISH, name: 'Inne' }, { language: ListingLanguage.ENGLISH, name: 'Other' }] },
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly favoritesService: FavoritesService,
  ) { }

  async onModuleInit() {
    await this.ensureCategories();
    await this.ensureLocations();
    await this.ensureSkills();
  }

  private async ensureCategories() {
    const count = await this.prisma.category.count();
    if (count === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await this.prisma.category.create({
          data: {
            slug: cat.slug,
            translations: {
              create: cat.translations,
            },
          },
        });
      }
    } else {
      // Ensure all categories exist and have translations
      for (const cat of DEFAULT_CATEGORIES) {
        let existing = await this.prisma.category.findUnique({
          where: { slug: cat.slug },
          include: { translations: true },
        });

        // Create category if it doesn't exist
        if (!existing) {
          existing = await this.prisma.category.create({
            data: {
              slug: cat.slug,
              translations: {
                create: cat.translations,
              },
            },
            include: { translations: true },
          });
        } else {
          // Ensure all translations exist for existing categories
          for (const trans of cat.translations) {
            const existingTrans = existing.translations.find(
              (t) => t.language === trans.language
            );
            if (!existingTrans) {
              await this.prisma.categoryTranslation.create({
                data: {
                  categoryId: existing.id,
                  language: trans.language,
                  name: trans.name,
                },
              });
            } else if (existingTrans.name !== trans.name) {
              // Update translation if name changed
              await this.prisma.categoryTranslation.update({
                where: { id: existingTrans.id },
                data: { name: trans.name },
              });
            }
          }
        }
      }
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

  async getCategories(userLanguage: ListingLanguage = ListingLanguage.POLISH) {
    const categories = await this.prisma.category.findMany({
      include: {
        translations: {
          where: { language: userLanguage },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.translations[0]?.name || cat.slug,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  private getCategoryWithTranslation(category: any, userLanguage: ListingLanguage = ListingLanguage.POLISH) {
    if (!category) return null;
    const translation = category.translations?.find((t: any) => t.language === userLanguage);
    return {
      id: category.id,
      slug: category.slug,
      name: translation?.name || category.slug,
    };
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

  async createListing(authorId: string, accountType: string | null, dto: CreateListingDto, userLanguage: ListingLanguage = ListingLanguage.POLISH) {
    if (accountType !== 'CLIENT') {
      throw new ForbiddenException('Tylko klienci mogą tworzyć ogłoszenia');
    }
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
      include: {
        translations: {
          where: { language: userLanguage },
        },
      },
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
    const language = dto.language ? (dto.language as ListingLanguage) : ListingLanguage.POLISH;
    const listing = await this.prisma.listing.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        authorId,
        status: ListingStatus.DRAFT,
        language,
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
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
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
    const result = await this.prisma.listing.findUnique({
      where: { id: listing.id },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    if (!result) return null;
    return {
      ...result,
      category: this.getCategoryWithTranslation(result.category, userLanguage),
    };
  }

  /** Feed: published for everyone; when userId is set, also include that user's draft listings. Optional categoryId and language filter. */
  async getFeed(take = 50, cursor?: string, userId?: string, categoryId?: string, language?: string, userLanguage: ListingLanguage = ListingLanguage.POLISH) {
    const statusWhere = userId
      ? { OR: [{ status: ListingStatus.PUBLISHED }, { status: ListingStatus.DRAFT, authorId: userId }] }
      : { status: ListingStatus.PUBLISHED };
    let where: Record<string, unknown> = categoryId
      ? { ...statusWhere, categoryId }
      : statusWhere;
    if (language && (language === 'ENGLISH' || language === 'POLISH')) {
      where = { ...where, language: language as ListingLanguage };
    }
    const listings = await this.prisma.listing.findMany({
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    const hasMore = listings.length > take;
    const rawItems = hasMore ? listings.slice(0, take) : listings;
    const nextCursor = hasMore ? rawItems[rawItems.length - 1].id : undefined;
    const favoriteIds = userId ? await this.favoritesService.getFavoriteListingIds(userId) : new Set<string>();
    const items = rawItems.map((item) => ({
      ...item,
      category: this.getCategoryWithTranslation(item.category, userLanguage),
      isFavorite: favoriteIds.has(item.id),
    }));
    return { items, nextCursor };
  }

  /** Get single listing by id. Author or ADMIN can read own/draft; others only published. */
  async getListing(listingId: string, userId?: string, isAdmin?: boolean, userLanguage: ListingLanguage = ListingLanguage.POLISH) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
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
    const isFavorite = userId
      ? (await this.favoritesService.getFavoriteListingIds(userId)).has(listing.id)
      : false;
    const { applications: _app, ...rest } = listing;
    return {
      ...rest,
      category: this.getCategoryWithTranslation(listing.category, userLanguage),
      applications: applicationsForResponse,
      currentUserApplied,
      isFavorite,
    };
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
  async updateListing(listingId: string, userId: string, accountType: string | null, dto: CreateListingDto, userLanguage: ListingLanguage = ListingLanguage.POLISH) {
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
      include: {
        translations: {
          where: { language: userLanguage },
        },
      },
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
    const language = dto.language ? (dto.language as ListingLanguage) : listing.language;
    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        status: ListingStatus.DRAFT,
        language,
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
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
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
    const result = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    if (!result) return null;
    return {
      ...result,
      category: this.getCategoryWithTranslation(result.category, userLanguage),
    };
  }

  async publishListing(listingId: string, adminUserId: string, isAdmin: boolean, userLanguage: ListingLanguage = ListingLanguage.POLISH) {
    if (!isAdmin) {
      throw new ForbiddenException('Tylko użytkownik z typem konta ADMIN może publikować ogłoszenia');
    }
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    const result = await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.PUBLISHED },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    return {
      ...result,
      category: this.getCategoryWithTranslation(result.category, userLanguage),
    };
  }
}
