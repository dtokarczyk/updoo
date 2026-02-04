import { ForbiddenException, Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { FavoritesService } from './favorites.service';
import { CreateJobDto } from './dto/create-job.dto';
import { BillingType, HoursPerWeek, ExperienceLevel, ProjectType, JobStatus, JobLanguage } from '@prisma/client';

const DEFAULT_CATEGORIES = [
  {
    slug: 'programming',
    translations: [
      { language: JobLanguage.POLISH, name: 'Programowanie' },
      { language: JobLanguage.ENGLISH, name: 'Programming' },
    ],
  },
  {
    slug: 'design',
    translations: [
      { language: JobLanguage.POLISH, name: 'Design' },
      { language: JobLanguage.ENGLISH, name: 'Design' },
    ],
  },
  {
    slug: 'marketing',
    translations: [
      { language: JobLanguage.POLISH, name: 'Marketing' },
      { language: JobLanguage.ENGLISH, name: 'Marketing' },
    ],
  },
  {
    slug: 'writing',
    translations: [
      { language: JobLanguage.POLISH, name: 'Pisanie' },
      { language: JobLanguage.ENGLISH, name: 'Writing' },
    ],
  },
  {
    slug: 'office-working',
    translations: [
      { language: JobLanguage.POLISH, name: 'Prace biurowe' },
      { language: JobLanguage.ENGLISH, name: 'Office Work' },
    ],
  },
  {
    slug: 'other',
    translations: [
      { language: JobLanguage.POLISH, name: 'Inne' },
      { language: JobLanguage.ENGLISH, name: 'Other' },
    ],
  },
];

const ALLOWED_CATEGORY_SLUGS = DEFAULT_CATEGORIES.map((c) => c.slug);

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
export class JobsService implements OnModuleInit {
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

  private getCategoryWithTranslation(category: any, userLanguage: JobLanguage = JobLanguage.POLISH) {
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

    return grouped.map((g) => {
      const skill = skills.find((s) => s.id === g.skillId);
      const count = typeof g._count === 'object' && g._count && 'skillId' in g._count
        ? (g._count as { skillId?: number }).skillId ?? 0
        : 0;
      return {
        id: g.skillId,
        name: skill?.name ?? '',
        count,
      };
    }).filter((s) => s.name);
  }

  async createJob(authorId: string, accountType: string | null, dto: CreateJobDto, userLanguage: JobLanguage = JobLanguage.POLISH) {
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
    const language = dto.language ? (dto.language as JobLanguage) : JobLanguage.POLISH;
    const job = await this.prisma.job.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        authorId,
        status: JobStatus.DRAFT,
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
      await this.prisma.jobSkill.createMany({
        data: [...skillIdsToLink].map((skillId) => ({
          jobId: job.id,
          skillId,
        })),
      });
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

  /** Feed: published for everyone; when userId is set, also include that user's draft jobs.
   * When isAdmin is true, include all draft jobs (not just user's own).
   * Optional filters: categoryId, language and skills (at least one of the job skills must match).
   */
  async getFeed(
    page = 1,
    pageSize = 15,
    userId?: string,
    isAdmin?: boolean,
    categoryId?: string,
    language?: string,
    skillIds?: string[],
    userLanguage: JobLanguage = JobLanguage.POLISH,
  ) {
    let statusWhere: Record<string, unknown>;
    if (isAdmin) {
      // Admin sees all jobs (published + closed + all drafts)
      statusWhere = {
        OR: [
          { status: JobStatus.PUBLISHED },
          { status: JobStatus.CLOSED },
          { status: JobStatus.DRAFT }
        ]
      };
    } else if (userId) {
      // Regular user sees published + closed + own drafts
      statusWhere = {
        OR: [
          { status: JobStatus.PUBLISHED },
          { status: JobStatus.CLOSED },
          { status: JobStatus.DRAFT, authorId: userId }
        ]
      };
    } else {
      // Not logged in: only published and closed
      statusWhere = {
        OR: [
          { status: JobStatus.PUBLISHED },
          { status: JobStatus.CLOSED }
        ]
      };
    }
    let where: Record<string, unknown> = categoryId
      ? { ...statusWhere, categoryId }
      : statusWhere;
    if (language && (language === 'ENGLISH' || language === 'POLISH')) {
      where = { ...where, language: language as JobLanguage };
    }
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
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    const favoriteIds = userId ? await this.favoritesService.getFavoriteJobIds(userId) : new Set<string>();

    const appliedIds = userId && jobs.length
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
      return {
        ...rest,
        category: this.getCategoryWithTranslation(item.category, userLanguage),
        isFavorite: favoriteIds.has(item.id),
        currentUserApplied: appliedIds.has(item.id),
        applicationsCount: _count?.applications ?? 0,
      };
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
      }
    };
  }

  /** Get single job by id. Author or ADMIN can read own/draft; others only published. */
  async getJob(jobId: string, userId?: string, isAdmin?: boolean, userLanguage: JobLanguage = JobLanguage.POLISH) {
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
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const isAuthor = userId && job.authorId === userId;
    if (job.status === JobStatus.DRAFT && !isAuthor && !isAdmin) {
      throw new NotFoundException('Job not found');
    }
    // CLOSED jobs are visible to everyone (like PUBLISHED)
    const isAuthorOrAdmin = isAuthor || isAdmin;
    // Author/admin: full application data; others: only freelancer initials
    const applicationsForResponse = job.applications.map((app) => {
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
        freelancerDisplayName: this.getFirstNameAndSurnameInitial(
          app.freelancer.name,
          app.freelancer.surname,
        ),
        freelancerInitials: this.getInitials(app.freelancer.name, app.freelancer.surname),
        createdAt: app.createdAt,
      };
    });
    const currentUserApplied = Boolean(
      userId && job.applications.some((a) => a.freelancerId === userId),
    );
    const currentUserApplication = userId
      ? job.applications.find((a) => a.freelancerId === userId)
      : undefined;
    const currentUserApplicationMessage = currentUserApplication?.message ?? undefined;
    const isFavorite = userId
      ? (await this.favoritesService.getFavoriteJobIds(userId)).has(job.id)
      : false;
    const { applications: _app, ...rest } = job;
    return {
      ...rest,
      category: this.getCategoryWithTranslation(job.category, userLanguage),
      applications: applicationsForResponse,
      currentUserApplied,
      currentUserApplicationMessage,
      isFavorite,
    };
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
  async getPrevNextJob(jobId: string, userId?: string, isAdmin?: boolean, userLanguage: JobLanguage = JobLanguage.POLISH) {
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
    if (currentJob.status === JobStatus.DRAFT && !isAuthor && !isAdmin) {
      throw new NotFoundException('Job not found');
    }

    // Build status filter - same logic as getFeed
    let statusWhere: Record<string, unknown>;
    if (isAdmin) {
      statusWhere = {
        OR: [
          { status: JobStatus.PUBLISHED },
          { status: JobStatus.CLOSED },
          { status: JobStatus.DRAFT }
        ]
      };
    } else if (userId) {
      statusWhere = {
        OR: [
          { status: JobStatus.PUBLISHED },
          { status: JobStatus.CLOSED },
          { status: JobStatus.DRAFT, authorId: userId }
        ]
      };
    } else {
      statusWhere = {
        OR: [
          { status: JobStatus.PUBLISHED },
          { status: JobStatus.CLOSED }
        ]
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

    if (currentJob.status === JobStatus.DRAFT) {
      // For DRAFT: prev is newer DRAFT, next is older DRAFT or newest PUBLISHED
      prevJob = await this.prisma.job.findFirst({
        where: {
          ...baseWhere,
          status: JobStatus.DRAFT,
          createdAt: { gt: currentJob.createdAt },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true },
      });

      // If no newer DRAFT, try older DRAFT
      if (!prevJob) {
        prevJob = await this.prisma.job.findFirst({
          where: {
            ...baseWhere,
            status: JobStatus.DRAFT,
            createdAt: { lt: currentJob.createdAt },
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true },
        });
      }

      // Next: older DRAFT or newest PUBLISHED
      nextJob = await this.prisma.job.findFirst({
        where: {
          ...baseWhere,
          status: JobStatus.DRAFT,
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

      // If no newer PUBLISHED, try newest DRAFT
      if (!prevJob) {
        prevJob = await this.prisma.job.findFirst({
          where: {
            ...baseWhere,
            status: JobStatus.DRAFT,
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
      throw new ForbiddenException('Tylko freelancerzy mogą zgłaszać się do ofert');
    }
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.status === JobStatus.DRAFT) {
      throw new NotFoundException('Job not found');
    }
    if (job.status === JobStatus.CLOSED) {
      throw new ForbiddenException('Ogłoszenie jest zamknięte');
    }
    if (job.authorId === freelancerId) {
      throw new ForbiddenException('Nie możesz zgłosić się do własnej oferty');
    }
    const now = new Date();
    if (job.deadline && job.deadline < now) {
      throw new ForbiddenException('Termin zgłoszeń minął');
    }
    const trimmedMessage = message?.trim() || undefined;
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
    return { ok: true };
  }

  /** Get user's recent job applications (last 5). */
  async getUserApplications(freelancerId: string, userLanguage: JobLanguage = JobLanguage.POLISH, limit = 5) {
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
            author: { select: { id: true, email: true, name: true, surname: true } },
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
        category: this.getCategoryWithTranslation(app.job.category, userLanguage),
      },
    }));
  }

  /** Get user's recent jobs (last 5) created by client. */
  async getUserJobs(clientId: string, userLanguage: JobLanguage = JobLanguage.POLISH, limit = 5) {
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
        author: { select: { id: true, email: true, name: true, surname: true } },
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
        category: this.getCategoryWithTranslation(job.category, userLanguage),
        applicationsCount: _count?.applications ?? 0,
      };
    });
  }

  /** Update job. Only author can update (or admin can update any); status is always set to DRAFT so admin can re-approve. */
  async updateJob(jobId: string, userId: string, accountType: string | null, dto: CreateJobDto, userLanguage: JobLanguage = JobLanguage.POLISH) {
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
        ? new Date(job.createdAt.getTime() + dto.offerDays * 24 * 60 * 60 * 1000)
        : undefined;
    const language = dto.language ? (dto.language as JobLanguage) : job.language;
    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        status: JobStatus.DRAFT,
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

  async publishJob(jobId: string, adminUserId: string, isAdmin: boolean, userLanguage: JobLanguage = JobLanguage.POLISH) {
    if (!isAdmin) {
      throw new ForbiddenException('Tylko użytkownik z typem konta ADMIN może publikować oferty');
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

  /** Close a job. Only author or admin can close. */
  async closeJob(jobId: string, userId: string, accountType: string | null, userLanguage: JobLanguage = JobLanguage.POLISH) {
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
      throw new ForbiddenException('Tylko użytkownik z typem konta ADMIN może przeglądać oferty oczekujące na zatwierdzenie');
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
        author: { select: { id: true, email: true, name: true, surname: true } },
        location: true,
        skills: { include: { skill: true } },
      },
    });

    const favoriteIds = await this.favoritesService.getFavoriteJobIds(userId);

    const items = jobs.map((item) => ({
      ...item,
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
      }
    };
  }
}
