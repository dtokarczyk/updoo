import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { FavoritesService } from './favorites.service';
import { CreateJobDto } from './dto/create-job.dto';
import { maskAuthorSurname } from './author-helpers';
import {
  BillingType,
  HoursPerWeek,
  ExperienceLevel,
  ProjectType,
  JobStatus,
  JobLanguage,
  AccountType,
} from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';
import { I18nService } from '../i18n/i18n.service';
import type { SupportedLanguage } from '../i18n/i18n.service';
import { randomBytes } from 'crypto';
import { slugFromName } from '../common/slug.helper';
import { DEFAULT_CATEGORIES, ALLOWED_CATEGORY_SLUGS } from './jobs.constants';
import { OgImageService } from './og-image.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly favoritesService: FavoritesService,
    private readonly aiService: AiService,
    private readonly emailService: EmailService,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly i18nService: I18nService,
    private readonly ogImageService: OgImageService,
    private readonly storageService: StorageService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) { }

  async onModuleInit() {
    await this.ensureCategories();
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
              (t) => t.language === trans.language,
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

  async getCategories(userLanguage: JobLanguage = JobLanguage.POLISH) {
    const categories = await this.prisma.category.findMany({
      where: {
        slug: {
          in: ALLOWED_CATEGORY_SLUGS,
        },
      },
      include: {
        translations: {
          where: { language: userLanguage },
        },
      },
    });

    return categories
      .map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.translations[0]?.name || cat.slug,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private getCategoryWithTranslation(
    category: any,
    userLanguage: JobLanguage = JobLanguage.POLISH,
  ) {
    if (!category) return null;
    const translation = category.translations?.find(
      (t: any) => t.language === userLanguage,
    );
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

  /** Return up to 10 most frequently used skills for jobs in given category. Only published jobs are taken into account. */
  async getPopularSkillsForCategory(categoryId: string, limit = 10) {
    // Group job skills within a category and count how many times they are used.
    const grouped = await this.prisma.jobSkill.groupBy({
      by: ['skillId'],
      _count: {
        skillId: true,
      },
      where: {
        job: {
          categoryId,
          status: JobStatus.PUBLISHED,
        },
      },
      orderBy: [
        {
          _count: {
            skillId: 'desc',
          },
        },
      ],
      take: limit,
    });

    if (!grouped.length) {
      return [];
    }

    const skillIds = grouped.map((g) => g.skillId);
    const skills = await this.prisma.skill.findMany({
      where: { id: { in: skillIds } },
    });

    return grouped
      .map((g) => {
        const skill = skills.find((s) => s.id === g.skillId);
        const count =
          typeof g._count === 'object' && g._count && 'skillId' in g._count
            ? ((g._count as { skillId?: number }).skillId ?? 0)
            : 0;
        return {
          id: g.skillId,
          name: skill?.name ?? '',
          count,
        };
      })
      .filter((s) => s.name);
  }

  async createJob(
    authorId: string,
    accountType: string | null,
    dto: CreateJobDto,
    userLanguage: JobLanguage = JobLanguage.POLISH,
  ) {
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
    if (skillIdsToLink.size > 5) {
      throw new BadRequestException('validation.skillsMaxCount');
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
    // Job announcements are always in Polish
    const language = JobLanguage.POLISH;
    const job = await this.prisma.job.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        authorId,
        status: JobStatus.DRAFT,
        language,
        billingType: dto.billingType as BillingType,
        hoursPerWeek:
          dto.billingType === 'HOURLY' && dto.hoursPerWeek
            ? (dto.hoursPerWeek as HoursPerWeek)
            : null,
        rate: dto.rate ?? null,
        rateNegotiable: dto.rateNegotiable ?? false,
        currency: dto.currency.toUpperCase().slice(0, 3),
        experienceLevel: dto.experienceLevel as ExperienceLevel,
        locationId: dto.locationId || null,
        isRemote: dto.isRemote,
        projectType: dto.projectType as ProjectType,
        deadline,
        expectedOffers:
          dto.expectedOffers != null && [6, 10, 14].includes(dto.expectedOffers)
            ? dto.expectedOffers
            : null,
        expectedApplicantTypes: dto.expectedApplicantTypes ?? [],
      },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    if (skillIdsToLink.size > 0) {
      await this.prisma.jobSkill.createMany({
        data: [...skillIdsToLink].map((skillId) => ({
          jobId: job.id,
          skillId,
        })),
      });
    } else {
      void this.attachSkillsFromContentAsync(
        job.id,
        dto.title.trim(),
        dto.description.trim(),
      );
    }
    const result = await this.prisma.job.findUnique({
      where: { id: job.id },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    if (!result) return null;
    const ogImageUrl = await this.ensureJobOgImage(result.id);
    return {
      ...result,
      ...(ogImageUrl != null && { ogImageUrl }),
      author: maskAuthorSurname(result.author),
      category: this.getCategoryWithTranslation(result.category, userLanguage),
    };
  }

  /**
   * Create a DRAFT job for proposal invitation flow (admin creates on behalf of invitee).
   * No accountType check. Sets previewHash for draft preview link.
   */
  async createJobForProposal(
    authorId: string,
    dto: CreateJobDto,
    userLanguage: JobLanguage = JobLanguage.POLISH,
  ): Promise<{ id: string; title: string; previewHash: string }> {
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
    if (skillIdsToLink.size > 5) {
      throw new BadRequestException('validation.skillsMaxCount');
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
    const language = JobLanguage.POLISH;
    const previewHash = randomBytes(16).toString('hex');
    const job = await this.prisma.job.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        authorId,
        status: JobStatus.DRAFT,
        language,
        previewHash,
        billingType: dto.billingType as BillingType,
        hoursPerWeek:
          dto.billingType === 'HOURLY' && dto.hoursPerWeek
            ? (dto.hoursPerWeek as HoursPerWeek)
            : null,
        rate: dto.rate ?? null,
        rateNegotiable: dto.rateNegotiable ?? false,
        currency: dto.currency.toUpperCase().slice(0, 3),
        experienceLevel: dto.experienceLevel as ExperienceLevel,
        locationId: dto.locationId || null,
        isRemote: dto.isRemote,
        projectType: dto.projectType as ProjectType,
        deadline,
        expectedOffers:
          dto.expectedOffers != null && [6, 10, 14].includes(dto.expectedOffers)
            ? dto.expectedOffers
            : null,
        expectedApplicantTypes: dto.expectedApplicantTypes ?? [],
      },
      include: {
        category: true,
        author: true,
        location: true,
        skills: { include: { skill: true } },
      },
    });
    if (skillIdsToLink.size > 0) {
      await this.prisma.jobSkill.createMany({
        data: [...skillIdsToLink].map((skillId) => ({
          jobId: job.id,
          skillId,
        })),
      });
    } else {
      void this.attachSkillsFromContentAsync(
        job.id,
        dto.title.trim(),
        dto.description.trim(),
      );
    }
    return { id: job.id, title: job.title, previewHash };
  }

  /**
   * Extract 1–5 expected skill names from job title and description via AI.
   * Runs in background; errors are logged and not thrown.
   */
  private async extractExpectedSkillNames(
    title: string,
    description: string,
  ): Promise<string[]> {
    const allSkillNames = (
      await this.prisma.skill.findMany({
        select: { name: true },
        orderBy: { name: 'asc' },
      })
    ).map((s) => s.name);
    const allowed = allSkillNames.slice(0, 500);
    const prompt = [
      'Na podstawie tytułu i opisu oferty pracy wybierz oczekiwane umiejętności (skille) do realizacji tej oferty.',
      `Tytuł: ${title}`,
      `Opis (fragment): ${description.slice(0, 2000)}`,
      allowed.length > 0
        ? `Dostępne skille – wybierz wyłącznie 1–5 nazw z tej listy (zwróć tablicę JSON skillNames):\n${allowed.join(', ')}`
        : 'Brak zdefiniowanych skilli w systemie. Podaj 1–5 krótkich nazw umiejętności (technologie, narzędzia, dziedziny) jako tablicę JSON skillNames.',
      'Zwróć JSON: {"skillNames": ["Nazwa1", "Nazwa2"]}. Tylko nazwy z podanej listy (gdy lista jest pusta – dowolne krótkie nazwy).',
    ].join('\n\n');

    try {
      const raw = await this.aiService.generateText({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            additionalProperties: false,
            required: ['skillNames'],
            properties: {
              skillNames: {
                type: 'array',
                items:
                  allowed.length > 0
                    ? { type: 'string' as const, enum: allowed }
                    : { type: 'string' as const },
                minItems: 0,
                maxItems: 5,
                description:
                  allowed.length > 0
                    ? '1–5 nazw umiejętności z podanej listy'
                    : '1–5 nazw umiejętności',
              },
            },
          },
        },
      });

      const parsed = JSON.parse(raw) as { skillNames?: unknown };
      const arr = Array.isArray(parsed.skillNames) ? parsed.skillNames : [];
      const allowedSet = new Set(allowed.map((n) => n.trim().toLowerCase()));
      return arr
        .filter(
          (n): n is string => typeof n === 'string' && n.trim().length > 0,
        )
        .map((n) => n.trim())
        .filter((n) => allowed.length === 0 || allowedSet.has(n.toLowerCase()))
        .slice(0, 5);
    } catch (err) {
      this.logger.warn(
        'extractExpectedSkillNames failed, returning empty',
        err as Error,
      );
      return [];
    }
  }

  /**
   * Asynchronously attach skills to a job by extracting them from content via AI.
   * Fire-and-forget: errors are logged only.
   */
  private attachSkillsFromContentAsync(
    jobId: string,
    title: string,
    description: string,
  ): void {
    void (async () => {
      try {
        const names = await this.extractExpectedSkillNames(title, description);
        if (names.length === 0) return;
        const skillIdsToAdd: string[] = [];
        for (const name of names) {
          const existing = await this.prisma.skill.findUnique({
            where: { name },
          });
          if (existing) {
            skillIdsToAdd.push(existing.id);
          } else {
            const created = await this.prisma.skill.create({
              data: { name },
            });
            skillIdsToAdd.push(created.id);
          }
          if (skillIdsToAdd.length >= 5) break;
        }
        if (skillIdsToAdd.length > 0) {
          await this.prisma.jobSkill.createMany({
            data: skillIdsToAdd.map((skillId) => ({ jobId, skillId })),
          });
          this.logger.log(
            `Attached ${skillIdsToAdd.length} AI-extracted skills to job ${jobId}`,
          );
        }
      } catch (err) {
        this.logger.warn(
          `attachSkillsFromContentAsync failed for job ${jobId}`,
          err as Error,
        );
      }
    })();
  }

  /** Feed: published for everyone; when userId is set, also include that user's draft jobs.
   * When isAdmin is true, include all draft jobs (not just user's own).
   * Optional filters: categoryId and skills (at least one of the job skills must match).
   */
  async getFeed(
    page = 1,
    pageSize = 15,
    userId?: string,
    isAdmin?: boolean,
    categoryId?: string,
    skillIds?: string[],
    userLanguage: JobLanguage = JobLanguage.POLISH,
  ) {
    let statusWhere: Record<string, unknown>;
    if (isAdmin) {
      // Admin sees all jobs (published + closed + drafts + rejected)
      statusWhere = {
        OR: [
          { status: JobStatus.PUBLISHED },
          { status: JobStatus.CLOSED },
          { status: JobStatus.DRAFT },
          { status: JobStatus.REJECTED },
        ],
      };
    } else if (userId) {
      // Regular user sees published + closed + own drafts + own rejected
      statusWhere = {
        OR: [
          { status: JobStatus.PUBLISHED },
          { status: JobStatus.CLOSED },
          { status: JobStatus.DRAFT, authorId: userId },
          { status: JobStatus.REJECTED, authorId: userId },
        ],
      };
    } else {
      // Not logged in: only published and closed
      statusWhere = {
        OR: [{ status: JobStatus.PUBLISHED }, { status: JobStatus.CLOSED }],
      };
    }
    let where: Record<string, unknown> = categoryId
      ? { ...statusWhere, categoryId }
      : statusWhere;
    if (skillIds && skillIds.length > 0) {
      // At least one of the selected skills must be attached to the job.
      where = {
        ...where,
        skills: {
          some: {
            skillId: {
              in: skillIds,
            },
          },
        },
      };
    }

    const skip = (page - 1) * pageSize;

    // Get total count for pagination metadata
    const total = await this.prisma.job.count({ where });

    // Sort: drafts first (DRAFT status), then published, both sorted by createdAt desc
    const jobs = await this.prisma.job.findMany({
      skip,
      take: pageSize,
      where,
      orderBy: [
        { status: 'asc' }, // DRAFT comes before PUBLISHED/CLOSED alphabetically
        { createdAt: 'desc' },
      ],
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        location: true,
        skills: { include: { skill: true } },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    const favoriteIds = userId
      ? await this.favoritesService.getFavoriteJobIds(userId)
      : new Set<string>();

    const appliedIds =
      userId && jobs.length
        ? new Set(
          (
            await this.prisma.jobApplication.findMany({
              where: {
                freelancerId: userId,
                jobId: {
                  in: jobs.map((j) => j.id),
                },
              },
              select: { jobId: true },
            })
          ).map((a) => a.jobId),
        )
        : new Set<string>();

    const items = jobs.map((item) => {
      const { _count, ...rest } = item;
      const base = {
        ...rest,
        author: maskAuthorSurname(item.author),
        category: this.getCategoryWithTranslation(item.category, userLanguage),
        isFavorite: favoriteIds.has(item.id),
        currentUserApplied: appliedIds.has(item.id),
        applicationsCount: _count?.applications ?? 0,
      };
      // Hide rate for unauthenticated users (billing type stays visible)
      if (!userId) {
        const { rate: _rate, ...withoutRate } = base;
        return { ...withoutRate, rate: null };
      }
      return base;
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /** Get single job by id. Author or ADMIN can read own/draft; others only published. With valid previewHash, draft is viewable and invitationToken returned when proposal is PENDING. */
  async getJob(
    jobId: string,
    userId?: string,
    isAdmin?: boolean,
    userLanguage: JobLanguage = JobLanguage.POLISH,
    previewHash?: string,
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        location: true,
        skills: { include: { skill: true } },
        applications: {
          include: {
            freelancer: {
              select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                phone: true,
                avatarUrl: true,
                profiles: { take: 1, select: { slug: true } },
              },
            },
          },
        },
        proposal: true,
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const isAuthor = userId && job.authorId === userId;
    const isDraftOrRejected =
      job.status === JobStatus.DRAFT || job.status === JobStatus.REJECTED;
    const allowedByPreview =
      previewHash &&
      job.previewHash === previewHash &&
      job.status === JobStatus.DRAFT;
    if (isDraftOrRejected && !isAuthor && !isAdmin && !allowedByPreview) {
      throw new NotFoundException('Job not found');
    }
    // CLOSED jobs are visible to everyone (like PUBLISHED)
    const isAuthorOrAdmin = isAuthor || isAdmin;
    // Full freelancer data (email, phone, name, etc.) only for job author/admin; others get first name + initial of surname only
    const applicationsForResponse = job.applications.map((app) => {
      if (isAuthorOrAdmin) {
        const freelancer = app.freelancer as typeof app.freelancer & {
          phone?: string | null;
          avatarUrl?: string | null;
          profiles?: { slug: string }[];
        };
        return {
          id: app.id,
          freelancer: {
            id: freelancer.id,
            email: freelancer.email,
            name: freelancer.name,
            surname: freelancer.surname,
            phone: freelancer.phone ?? undefined,
            avatarUrl: freelancer.avatarUrl ?? undefined,
            profileSlug: freelancer.profiles?.[0]?.slug ?? undefined,
          },
          message: app.message ?? undefined,
          createdAt: app.createdAt,
        };
      }
      return {
        id: app.id,
        freelancerDisplayName: this.getFirstNameAndSurnameInitial(
          app.freelancer.name,
          app.freelancer.surname,
        ),
        freelancerInitials: this.getInitials(
          app.freelancer.name,
          app.freelancer.surname,
        ),
        createdAt: app.createdAt,
        // Include message for the current user's own application so they can see what they wrote
        ...(userId &&
          app.freelancerId === userId &&
          app.message != null &&
          app.message !== ''
          ? { message: app.message }
          : {}),
      };
    });
    const currentUserApplied = Boolean(
      userId && job.applications.some((a) => a.freelancerId === userId),
    );
    const currentUserApplication = userId
      ? job.applications.find((a) => a.freelancerId === userId)
      : undefined;
    const currentUserApplicationMessage =
      currentUserApplication?.message ?? undefined;
    const isFavorite = userId
      ? (await this.favoritesService.getFavoriteJobIds(userId)).has(job.id)
      : false;
    const { applications: _app, proposal: _proposal, ...rest } = job;
    const invitationToken =
      job.proposal?.status === 'PENDING' &&
        (isAuthorOrAdmin || allowedByPreview)
        ? job.proposal.token
        : undefined;
    const result = {
      ...rest,
      author: maskAuthorSurname(job.author),
      category: this.getCategoryWithTranslation(job.category, userLanguage),
      applications: applicationsForResponse,
      currentUserApplied,
      currentUserApplicationMessage,
      isFavorite,
      ...(invitationToken != null && { invitationToken }),
    };
    // Hide rate for unauthenticated users (billing type stays visible), except when viewing via invitation preview
    if (!userId && !allowedByPreview) {
      const { rate: _rate, ...withoutRate } = result;
      return { ...withoutRate, rate: null };
    }
    return result;
  }

  /**
   * Get OG image buffer for a job: from storage if ogImageUrl is set, otherwise generate.
   * Uses findUnique (no visibility check) so the image can be served for draft/rejected jobs too (e.g. author preview).
   */
  async getJobOgImageBuffer(
    jobId: string,
    _userLanguage: JobLanguage = JobLanguage.POLISH,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          title: true,
          experienceLevel: true,
          billingType: true,
          currency: true,
          projectType: true,
          rate: true,
          ogImageUrl: true,
        },
      });
      if (!job) return null;
      if (job.ogImageUrl && this.storageService.isConfigured()) {
        const buffer = await this.storageService.getImage(job.ogImageUrl);
        if (buffer) {
          return { buffer, contentType: 'image/png' };
        }
      }
      const payload = {
        id: job.id,
        title: job.title,
        experienceLevel: job.experienceLevel,
        billingType: job.billingType,
        currency: job.currency,
        projectType: job.projectType,
        rate: job.rate != null ? String(job.rate) : null,
      };
      const buffer = await this.ogImageService.generateJobOgImage(payload);
      return { buffer, contentType: 'image/png' };
    } catch {
      return null;
    }
  }

  /**
   * Regenerate OG image for a job (admin only). Generates new image, uploads to storage,
   * updates job.ogImageUrl. Returns result with url on success or error message on failure.
   */
  async regenerateJobOgImage(
    jobId: string,
  ): Promise<{ ok: boolean; url?: string; error?: string }> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true },
    });
    if (!job) {
      return { ok: false, error: 'Job not found' };
    }
    const url = await this.ensureJobOgImage(jobId);
    if (url) {
      return { ok: true, url };
    }
    return {
      ok: false,
      error: 'Failed to generate or upload OG image',
    };
  }

  /**
   * Generate OG image for job, upload to storage, and update job.ogImageUrl.
   * Called on create, update, and publish. Returns the stored URL or null on failure.
   */
  private async ensureJobOgImage(jobId: string): Promise<string | null> {
    try {
      if (!this.storageService.isConfigured()) return null;
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          title: true,
          experienceLevel: true,
          billingType: true,
          currency: true,
          projectType: true,
          rate: true,
        },
      });
      if (!job) return null;
      const buffer = await this.ogImageService.generateJobOgImage({
        id: job.id,
        title: job.title,
        experienceLevel: job.experienceLevel,
        billingType: job.billingType,
        currency: job.currency,
        projectType: job.projectType,
        rate: job.rate != null ? String(job.rate) : null,
      });
      const url = await this.storageService.uploadOgImage(buffer, job.id);
      if (url) {
        await this.prisma.job.update({
          where: { id: jobId },
          data: { ogImageUrl: url },
        });
        return url;
      }
    } catch (err) {
      this.logger.warn(
        `OG image generation/upload failed for job ${jobId}`,
        err,
      );
    }
    return null;
  }

  private getInitials(name: string | null, surname: string | null): string {
    const n = (name?.trim() ?? '').charAt(0).toUpperCase();
    const s = (surname?.trim() ?? '').charAt(0).toUpperCase();
    if (n && s) return `${n}${s}`;
    if (n) return n;
    if (s) return s;
    return '';
  }

  /** First name + first letter of surname (e.g. "Jan K."). */
  private getFirstNameAndSurnameInitial(
    name: string | null,
    surname: string | null,
  ): string {
    const n = name?.trim() ?? '';
    const s = (surname?.trim() ?? '').charAt(0);
    if (n && s) return `${n} ${s}.`;
    if (n) return n;
    if (s) return `${s}.`;
    return '';
  }

  /** Get previous and next job in the same category. Uses same sorting as feed: status asc, createdAt desc. */
  async getPrevNextJob(
    jobId: string,
    userId?: string,
    isAdmin?: boolean,
    userLanguage: JobLanguage = JobLanguage.POLISH,
  ) {
    const currentJob = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        categoryId: true,
        status: true,
        createdAt: true,
        authorId: true,
      },
    });

    if (!currentJob) {
      throw new NotFoundException('Job not found');
    }

    const isAuthor = userId && currentJob.authorId === userId;
    const isDraftOrRejected =
      currentJob.status === JobStatus.DRAFT ||
      currentJob.status === JobStatus.REJECTED;
    if (isDraftOrRejected && !isAuthor && !isAdmin) {
      throw new NotFoundException('Job not found');
    }

    // Build status filter - same logic as getFeed
    let statusWhere: Record<string, unknown>;
    if (isAdmin) {
      statusWhere = {
        OR: [
          { status: JobStatus.PUBLISHED },
          { status: JobStatus.CLOSED },
          { status: JobStatus.DRAFT },
          { status: JobStatus.REJECTED },
        ],
      };
    } else if (userId) {
      statusWhere = {
        OR: [
          { status: JobStatus.PUBLISHED },
          { status: JobStatus.CLOSED },
          { status: JobStatus.DRAFT, authorId: userId },
          { status: JobStatus.REJECTED, authorId: userId },
        ],
      };
    } else {
      statusWhere = {
        OR: [{ status: JobStatus.PUBLISHED }, { status: JobStatus.CLOSED }],
      };
    }

    const baseWhere = {
      ...statusWhere,
      categoryId: currentJob.categoryId,
      id: { not: currentJob.id },
    };

    // Sort order: status asc (DRAFT before PUBLISHED), createdAt desc (newer first)
    // Previous = comes before current in this order
    // Next = comes after current in this order

    let prevJob = null;
    let nextJob = null;

    const draftOrRejectedStatus = {
      in: [JobStatus.DRAFT, JobStatus.REJECTED],
    };
    if (
      currentJob.status === JobStatus.DRAFT ||
      currentJob.status === JobStatus.REJECTED
    ) {
      // For DRAFT/REJECTED: prev is newer DRAFT/REJECTED, next is older or newest PUBLISHED
      prevJob = await this.prisma.job.findFirst({
        where: {
          ...baseWhere,
          status: draftOrRejectedStatus,
          createdAt: { gt: currentJob.createdAt },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true },
      });

      if (!prevJob) {
        prevJob = await this.prisma.job.findFirst({
          where: {
            ...baseWhere,
            status: draftOrRejectedStatus,
            createdAt: { lt: currentJob.createdAt },
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true },
        });
      }

      nextJob = await this.prisma.job.findFirst({
        where: {
          ...baseWhere,
          status: draftOrRejectedStatus,
          createdAt: { lt: currentJob.createdAt },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true },
      });

      if (!nextJob) {
        nextJob = await this.prisma.job.findFirst({
          where: {
            ...baseWhere,
            status: JobStatus.PUBLISHED,
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true },
        });
      }
    } else {
      // For PUBLISHED: prev is newer PUBLISHED or newest DRAFT, next is older PUBLISHED
      prevJob = await this.prisma.job.findFirst({
        where: {
          ...baseWhere,
          status: JobStatus.PUBLISHED,
          createdAt: { gt: currentJob.createdAt },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true },
      });

      // If no newer PUBLISHED, try newest DRAFT or REJECTED
      if (!prevJob) {
        prevJob = await this.prisma.job.findFirst({
          where: {
            ...baseWhere,
            status: draftOrRejectedStatus,
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true },
        });
      }

      // Next: older PUBLISHED
      nextJob = await this.prisma.job.findFirst({
        where: {
          ...baseWhere,
          status: JobStatus.PUBLISHED,
          createdAt: { lt: currentJob.createdAt },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true },
      });
    }

    return {
      prev: prevJob ? { id: prevJob.id, title: prevJob.title } : null,
      next: nextJob ? { id: nextJob.id, title: nextJob.title } : null,
    };
  }

  /** Freelancer applies to a job. Allowed only before deadline. */
  async applyToJob(
    jobId: string,
    freelancerId: string,
    accountType: string | null,
    message?: string,
  ) {
    if (accountType !== 'FREELANCER') {
      throw new ForbiddenException(
        'Tylko freelancerzy mogą zgłaszać się do ofert',
      );
    }
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.status === JobStatus.DRAFT || job.status === JobStatus.REJECTED) {
      throw new NotFoundException('Job not found');
    }
    if (job.status === JobStatus.CLOSED) {
      throw new ForbiddenException('Ogłoszenie jest zamknięte');
    }
    if (job.authorId === freelancerId) {
      throw new ForbiddenException('Nie możesz zgłosić się do własnej oferty');
    }
    if (job.expectedOffers != null) {
      const existingApplication = await this.prisma.jobApplication.findUnique({
        where: {
          jobId_freelancerId: { jobId, freelancerId },
        },
      });
      if (!existingApplication) {
        const applicationsCount = await this.prisma.jobApplication.count({
          where: { jobId },
        });
        if (applicationsCount >= job.expectedOffers) {
          throw new ForbiddenException(
            'Osiągnięto maksymalną liczbę ofert dla tego ogłoszenia',
          );
        }
      }
    }
    const now = new Date();
    if (job.deadline && job.deadline < now) {
      throw new ForbiddenException('Termin zgłoszeń minął');
    }
    // Check expected applicant types: freelancer must match at least one allowed type
    const allowedTypes = job.expectedApplicantTypes ?? [];
    if (allowedTypes.length > 0) {
      const freelancer = await this.prisma.user.findUnique({
        where: { id: freelancerId },
        include: { company: { select: { companySize: true } } },
      });
      if (!freelancer) {
        throw new NotFoundException('errors.userNotFound');
      }
      const hasCompany = freelancer.companyId != null;
      const companySize = freelancer.company?.companySize ?? null;
      const isCompanySize =
        companySize != null &&
        ['MICRO', 'SMALL', 'MEDIUM', 'LARGE'].includes(companySize);
      const userTypes: string[] = [];
      if (!hasCompany) userTypes.push('FREELANCER_NO_B2B');
      if (hasCompany && companySize === 'FREELANCER')
        userTypes.push('FREELANCER_B2B');
      if (hasCompany && isCompanySize) userTypes.push('COMPANY');
      const meetsCriteria = userTypes.some((t) => allowedTypes.includes(t));
      if (!meetsCriteria) {
        throw new ForbiddenException('messages.applyApplicantTypeMismatch');
      }
    }
    const trimmedMessage = message?.trim() || undefined;
    const existingApplication = await this.prisma.jobApplication.findUnique({
      where: {
        jobId_freelancerId: { jobId, freelancerId },
      },
    });
    await this.prisma.jobApplication.upsert({
      where: {
        jobId_freelancerId: { jobId, freelancerId },
      },
      create: {
        jobId,
        freelancerId,
        message: trimmedMessage,
      },
      update: { message: trimmedMessage },
    });

    // Notify job author about new application (only for first-time applications)
    if (!existingApplication) {
      await this.notificationsService
        .onNewApplicationToMyJob(jobId, freelancerId)
        .catch((err) =>
          this.logger.warn(
            `Failed to send new-application notification for job ${jobId}`,
            err,
          ),
        );
    }

    // Auto-close job when expected number of applications is reached
    if (job.expectedOffers != null && job.status === JobStatus.PUBLISHED) {
      const applicationsCount = await this.prisma.jobApplication.count({
        where: { jobId },
      });
      if (applicationsCount >= job.expectedOffers) {
        const now = new Date();
        await this.prisma.job.update({
          where: { id: jobId },
          data: { status: JobStatus.CLOSED, closedAt: now },
        });
      }
    }

    return { ok: true };
  }

  /** Get user's recent job applications (last 5). */
  async getUserApplications(
    freelancerId: string,
    userLanguage: JobLanguage = JobLanguage.POLISH,
    limit = 5,
  ) {
    const applications = await this.prisma.jobApplication.findMany({
      where: { freelancerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        job: {
          include: {
            category: {
              include: {
                translations: {
                  where: { language: userLanguage },
                },
              },
            },
            author: {
              select: {
                id: true,
                email: true,
                name: true,
                surname: true,
                avatarUrl: true,
              },
            },
            location: true,
            skills: { include: { skill: true } },
          },
        },
      },
    });

    return applications.map((app) => ({
      id: app.id,
      createdAt: app.createdAt,
      message: app.message ?? undefined,
      job: {
        ...app.job,
        author: maskAuthorSurname(app.job.author),
        category: this.getCategoryWithTranslation(
          app.job.category,
          userLanguage,
        ),
      },
    }));
  }

  /** Get user's recent jobs (last 5) created by client. */
  async getUserJobs(
    clientId: string,
    userLanguage: JobLanguage = JobLanguage.POLISH,
    limit = 5,
  ) {
    const jobs = await this.prisma.job.findMany({
      where: { authorId: clientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        location: true,
        skills: { include: { skill: true } },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    return jobs.map((job) => {
      const { _count, ...rest } = job;
      return {
        ...rest,
        author: maskAuthorSurname(job.author),
        category: this.getCategoryWithTranslation(job.category, userLanguage),
        applicationsCount: _count?.applications ?? 0,
      };
    });
  }

  /** Update job. Only author can update (or admin can update any); status is always set to DRAFT so admin can re-approve. */
  async updateJob(
    jobId: string,
    userId: string,
    accountType: string | null,
    dto: CreateJobDto,
    userLanguage: JobLanguage = JobLanguage.POLISH,
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const isAdmin = accountType === 'ADMIN';
    if (!isAdmin && job.authorId !== userId) {
      throw new ForbiddenException('Możesz edytować tylko swoje oferty');
    }
    if (!isAdmin && accountType !== 'CLIENT') {
      throw new ForbiddenException('Tylko klienci mogą edytować oferty');
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
    if (skillIdsToLink.size > 5) {
      throw new BadRequestException('validation.skillsMaxCount');
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
    await this.prisma.jobSkill.deleteMany({
      where: { jobId },
    });
    const allowedDays = [7, 14, 21, 30];
    const newDeadline =
      dto.offerDays != null && allowedDays.includes(dto.offerDays)
        ? new Date(
          job.createdAt.getTime() + dto.offerDays * 24 * 60 * 60 * 1000,
        )
        : undefined;
    // Job announcements are always in Polish
    const language = JobLanguage.POLISH;
    // When editing REJECTED job, clear rejection data and set to DRAFT for re-approval
    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        status: JobStatus.DRAFT,
        rejectedAt: null,
        rejectedReason: null,
        language,
        billingType: dto.billingType as BillingType,
        hoursPerWeek:
          dto.billingType === 'HOURLY' && dto.hoursPerWeek
            ? (dto.hoursPerWeek as HoursPerWeek)
            : null,
        rate: dto.rate ?? null,
        rateNegotiable: dto.rateNegotiable ?? false,
        currency: dto.currency.toUpperCase().slice(0, 3),
        experienceLevel: dto.experienceLevel as ExperienceLevel,
        locationId: dto.locationId || null,
        isRemote: dto.isRemote,
        projectType: dto.projectType as ProjectType,
        ...(newDeadline != null && { deadline: newDeadline }),
        expectedOffers:
          dto.expectedOffers != null && [6, 10, 14].includes(dto.expectedOffers)
            ? dto.expectedOffers
            : job.expectedOffers,
        expectedApplicantTypes:
          dto.expectedApplicantTypes !== undefined
            ? dto.expectedApplicantTypes
            : job.expectedApplicantTypes,
      },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    if (skillIdsToLink.size > 0) {
      await this.prisma.jobSkill.createMany({
        data: [...skillIdsToLink].map((skillId) => ({
          jobId: updated.id,
          skillId,
        })),
      });
    }
    const result = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    if (!result) return null;
    const ogImageUrl = await this.ensureJobOgImage(jobId);
    return {
      ...result,
      ...(ogImageUrl != null && { ogImageUrl }),
      author: maskAuthorSurname(result.author),
      category: this.getCategoryWithTranslation(result.category, userLanguage),
    };
  }

  async publishJob(
    jobId: string,
    adminUserId: string,
    isAdmin: boolean,
    userLanguage: JobLanguage = JobLanguage.POLISH,
  ) {
    if (!isAdmin) {
      throw new ForbiddenException(
        'Tylko użytkownik z typem konta ADMIN może publikować oferty',
      );
    }
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const result = await this.prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.PUBLISHED },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        location: true,
        skills: { include: { skill: true } },
      },
    });

    // Trigger notifications for matching freelancers (fire-and-forget)
    this.notificationsService.onJobPublished(jobId).catch((err) => {
      console.error('Failed to process notifications for job', jobId, err);
    });

    const ogImageUrl = await this.ensureJobOgImage(jobId);
    return {
      ...result,
      ...(ogImageUrl != null && { ogImageUrl }),
      author: maskAuthorSurname(result.author),
      category: this.getCategoryWithTranslation(result.category, userLanguage),
    };
  }

  /** Reject a job (admin only). Sends email to author with reason. */
  async rejectJob(
    jobId: string,
    adminUserId: string,
    isAdmin: boolean,
    reason: string,
    userLanguage: JobLanguage = JobLanguage.POLISH,
  ) {
    if (!isAdmin) {
      throw new ForbiddenException(
        'Tylko użytkownik z typem konta ADMIN może odrzucać oferty',
      );
    }
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            language: true,
            avatarUrl: true,
          },
        },
      },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.status !== JobStatus.DRAFT) {
      throw new BadRequestException(
        'Można odrzucić tylko oferty oczekujące na zatwierdzenie',
      );
    }
    const now = new Date();
    const result = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.REJECTED,
        rejectedAt: now,
        rejectedReason: reason.trim(),
      },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        location: true,
        skills: { include: { skill: true } },
      },
    });

    // Send email to author
    const authorLang: SupportedLanguage =
      job.author?.language === JobLanguage.ENGLISH ? 'en' : 'pl';
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const slug = slugFromName(job.title, 'oferta');
    const editUrl = `${frontendUrl}/job/${slug}-${job.id}/edit`;

    const { subject, html, text } = this.emailTemplates.render(
      'job-rejected',
      authorLang,
      {
        title: job.title,
        reason: reason.trim(),
        editUrl,
      },
    );

    if (this.emailService.isConfigured()) {
      await this.emailService.sendHtml(job.author.email, subject, html, {
        ...(text && { text }),
      });
    }

    return {
      ...result,
      author: maskAuthorSurname(result.author),
      category: this.getCategoryWithTranslation(result.category, userLanguage),
    };
  }

  /** Close a job. Only author or admin can close. */
  async closeJob(
    jobId: string,
    userId: string,
    accountType: string | null,
    userLanguage: JobLanguage = JobLanguage.POLISH,
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const isAdmin = accountType === 'ADMIN';
    if (!isAdmin && job.authorId !== userId) {
      throw new ForbiddenException('Możesz zamykać tylko swoje oferty');
    }
    if (job.status === JobStatus.CLOSED) {
      throw new ForbiddenException('Ogłoszenie jest już zamknięte');
    }
    const now = new Date();
    const result = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.CLOSED,
        closedAt: now,
      },
      include: {
        category: {
          include: {
            translations: {
              where: { language: userLanguage },
            },
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        location: true,
        skills: { include: { skill: true } },
      },
    });
    return {
      ...result,
      author: maskAuthorSurname(result.author),
      category: this.getCategoryWithTranslation(result.category, userLanguage),
    };
  }

  /** Cron job: automatically close jobs that have passed their deadline. Runs every minute. */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoCloseExpiredJobs() {
    const now = new Date();
    const result = await this.prisma.job.updateMany({
      where: {
        status: JobStatus.PUBLISHED,
        deadline: {
          lt: now,
        },
      },
      data: {
        status: JobStatus.CLOSED,
        closedAt: now,
      },
    });
    if (result.count > 0) {
      console.log(`Auto-closed ${result.count} expired job(s)`);
    }
  }

  /** Get all DRAFT jobs for admin approval. Only accessible by ADMIN users. */
  async getPendingJobs(
    page = 1,
    pageSize = 15,
    userId: string,
    isAdmin: boolean,
    userLanguage: JobLanguage = JobLanguage.POLISH,
  ) {
    if (!isAdmin) {
      throw new ForbiddenException(
        'Tylko użytkownik z typem konta ADMIN może przeglądać oferty oczekujące na zatwierdzenie',
      );
    }

    const where = { status: JobStatus.DRAFT };

    const skip = (page - 1) * pageSize;

    // Get total count for pagination metadata
    const total = await this.prisma.job.count({ where });

    const jobs = await this.prisma.job.findMany({
      skip,
      take: pageSize,
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
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            avatarUrl: true,
          },
        },
        location: true,
        skills: { include: { skill: true } },
      },
    });

    const favoriteIds = await this.favoritesService.getFavoriteJobIds(userId);

    const items = jobs.map((item) => ({
      ...item,
      author: maskAuthorSurname(item.author),
      category: this.getCategoryWithTranslation(item.category, userLanguage),
      isFavorite: favoriteIds.has(item.id),
      currentUserApplied: false,
    }));

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
