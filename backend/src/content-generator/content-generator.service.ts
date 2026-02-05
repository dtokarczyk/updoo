import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType, BillingType, ExperienceLevel, JobLanguage, JobStatus, ProjectType } from '@prisma/client';

export type SupportedLanguage = 'POLISH' | 'ENGLISH';

export interface GeneratedJobUserData {
  /** Display name of the client or company shown publicly. */
  displayName: string;
  /** Optional company name if different from display name. */
  companyName?: string;
  /** Short paragraph describing the client or company. */
  about: string;
}

export interface GeneratedJobFormData {
  user: GeneratedJobUserData;
  job: {
    /** Short, catchy job title. */
    title: string;
    /** Detailed job description (3–6 paragraphs) matching the category and language. */
    description: string;
    /** Billing type compatible with CreateJobDto/BillingTypeDto. */
    billingType: 'FIXED' | 'HOURLY';
    /** Suggested budget or hourly rate (non‑negative). */
    rate: number;
    /** 3‑letter currency code, e.g. PLN, EUR, USD. */
    currency: string;
    /** Experience level compatible with CreateJobDto/ExperienceLevelDto. */
    experienceLevel: 'JUNIOR' | 'MID' | 'SENIOR';
    /** Whether the work can be done fully remotely. */
    isRemote: boolean;
    /** Type of project compatible with CreateJobDto/ProjectTypeDto. */
    projectType: 'ONE_TIME' | 'CONTINUOUS';
    /** Number of days to collect offers (7, 14, 21 or 30). */
    offerDays: number;
    /** List of relevant skill names (tags) for this job and category. */
    skills: string[];
  };
}

@Injectable()
export class ContentGeneratorService {
  private readonly logger = new Logger(ContentGeneratorService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Generate a complete job form draft (user + job data) for a given category slug.
   * Uses Gemini structured output so that the response is directly mappable to the job creation form.
   */
  async generateJobPost(params: {
    categorySlug: string;
    language?: SupportedLanguage;
  }): Promise<GeneratedJobFormData> {
    const language = params.language ?? 'POLISH';
    const languageLabel = language === 'ENGLISH' ? 'English' : 'Polish';

    const prompt = [
      `You are an assistant that writes realistic freelance job offers in ${languageLabel}.`,
      `Generate one realistic freelance job offer for the category with slug "${params.categorySlug}".`,
      'The job description and all details MUST be consistent with this category.',
      'Return data that can directly pre-fill the job creation form and basic client profile.',
      '',
      'Requirements:',
      '- The job title must be short and catchy (max 90 characters).',
      '- The job description must be 3–6 paragraphs, detailed, and strictly related to the category.',
      `- All text must be written in ${languageLabel}.`,
      '- Choose realistic rates (budget) for the given category and experience level.',
      '- Choose experience level, remote flag, project type and offerDays values that make sense for this job.',
      '- Suggest 3–10 relevant skill names (tags) matching the category and job description.',
    ].join('\n');

    const raw = await this.aiService.generateText({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['user', 'job'],
          properties: {
            user: {
              type: 'object',
              description:
                'Details of the client posting the job, used to pre-fill the user profile form.',
              additionalProperties: false,
              required: ['displayName', 'about'],
              properties: {
                displayName: {
                  type: 'string',
                  description: 'Short display name of the client or company shown publicly.',
                },
                companyName: {
                  type: 'string',
                  description: 'Optional company name if different from display name.',
                },
                about: {
                  type: 'string',
                  description:
                    'Short paragraph describing the client or company, written in the requested language.',
                },
              },
            },
            job: {
              type: 'object',
              description:
                'Complete job offer fields to pre-fill the job creation form. All text must match the given category and language.',
              additionalProperties: false,
              required: [
                'title',
                'description',
                'billingType',
                'rate',
                'currency',
                'experienceLevel',
                'isRemote',
                'projectType',
                'offerDays',
              ],
              properties: {
                title: {
                  type: 'string',
                  description:
                    'Short, catchy job title (max 90 characters) written in the requested language.',
                },
                description: {
                  type: 'string',
                  description:
                    'Detailed job description (3–6 paragraphs) that clearly matches the given category slug and language.',
                },
                billingType: {
                  type: 'string',
                  description: 'Billing type compatible with FIXED or HOURLY.',
                  enum: ['FIXED', 'HOURLY'],
                },
                rate: {
                  type: 'number',
                  description:
                    'Suggested budget or hourly rate for the job. Must be a non-negative number.',
                  minimum: 0,
                },
                currency: {
                  type: 'string',
                  description:
                    '3-letter currency code like PLN, EUR or USD that fits the scenario (PLN is preferred).',
                },
                experienceLevel: {
                  type: 'string',
                  description:
                    'Experience level compatible with JUNIOR, MID or SENIOR for CreateJobDto.',
                  enum: ['JUNIOR', 'MID', 'SENIOR'],
                },
                isRemote: {
                  type: 'boolean',
                  description:
                    'True if the work can be done fully remotely. Choose a realistic value for the job.',
                },
                projectType: {
                  type: 'string',
                  description:
                    'Type of project compatible with ONE_TIME or CONTINUOUS for CreateJobDto.',
                  enum: ['ONE_TIME', 'CONTINUOUS'],
                },
                offerDays: {
                  type: 'integer',
                  description:
                    'Number of days to collect offers. Must be one of 7, 14, 21 or 30.',
                  enum: [7, 14, 21, 30],
                },
                skills: {
                  type: 'array',
                  description:
                    'List of 3–10 relevant skill names (tags) that clearly match this job and category.',
                  items: {
                    type: 'string',
                  },
                  minItems: 3,
                  maxItems: 10,
                },
              },
            },
          },
        },
      },
    });

    try {
      const parsed = JSON.parse(raw) as Partial<GeneratedJobFormData> | null;
      const job = parsed?.job ?? ({} as GeneratedJobFormData['job']);
      const user = parsed?.user ?? ({} as GeneratedJobFormData['user']);

      const title = (job.title ?? '').toString().trim();
      const description = (job.description ?? '').toString().trim();

      if (!title || !description) {
        throw new Error('Missing title or description in AI response JSON.');
      }

      const safeUser: GeneratedJobUserData = {
        displayName: (user.displayName ?? 'Client')?.toString().trim() || 'Client',
        companyName: user.companyName ? user.companyName.toString().trim() : undefined,
        about:
          (user.about ?? 'Client looking for a freelancer for this project.')
            .toString()
            .trim() || 'Client looking for a freelancer for this project.',
      };

      const safeJob: GeneratedJobFormData['job'] = {
        title,
        description,
        billingType:
          job.billingType === 'HOURLY'
            ? 'HOURLY'
            : 'FIXED',
        rate: typeof job.rate === 'number' && job.rate >= 0 ? job.rate : 1000,
        currency:
          (job.currency ?? (language === 'POLISH' ? 'PLN' : 'EUR'))
            .toString()
            .trim()
            .toUpperCase() || (language === 'POLISH' ? 'PLN' : 'EUR'),
        experienceLevel:
          job.experienceLevel === 'JUNIOR' ||
            job.experienceLevel === 'SENIOR'
            ? job.experienceLevel
            : 'MID',
        isRemote: typeof job.isRemote === 'boolean' ? job.isRemote : true,
        projectType:
          job.projectType === 'CONTINUOUS'
            ? 'CONTINUOUS'
            : 'ONE_TIME',
        offerDays:
          job.offerDays === 7 ||
            job.offerDays === 14 ||
            job.offerDays === 21 ||
            job.offerDays === 30
            ? job.offerDays
            : 14,
        skills: Array.isArray(job.skills)
          ? job.skills.map((s) => s.toString().trim()).filter((s) => s.length > 0)
          : [],
      };

      return {
        user: safeUser,
        job: safeJob,
      };
    } catch (error) {
      this.logger.warn(
        'Failed to parse structured job post JSON. Falling back to minimal text output.',
        error as Error,
      );
      const firstLine =
        raw
          .split('\n')
          .find((line) => line.trim().length > 0) ?? 'AI generated job offer';
      const fallbackTitle = firstLine.substring(0, 90);
      return {
        user: {
          displayName: 'Client',
          about: 'Client looking for a freelancer for this project.',
        },
        job: {
          title: fallbackTitle,
          description: raw,
          billingType: 'FIXED',
          rate: 1000,
          currency: language === 'POLISH' ? 'PLN' : 'EUR',
          experienceLevel: 'MID',
          isRemote: true,
          projectType: 'ONE_TIME',
          offerDays: 14,
          skills: [],
        },
      };
    }
  }

  /**
   * Generate and persist a new AI-based job in a random allowed category.
   * Creates a fake client account with password "FAKE." and publishes the job.
   * Returns the created job ID and category slug.
   */
  @Cron('0 9,13,17 * * *')
  async generateAiJobPostForRandomCategory(): Promise<{ jobId: string; categorySlug: string } | null> {
    const allowedCategorySlugs = [
      'programming',
      'design',
      'marketing',
      'writing',
      'office-working',
      'other',
    ];

    const categories = await this.prisma.category.findMany({
      where: {
        slug: {
          in: allowedCategorySlugs,
        },
      },
    });

    if (!categories.length) {
      this.logger.warn('AI jobs generator: no categories available.');
      return null;
    }

    const randomIndex = Math.floor(Math.random() * categories.length);
    const category = categories[randomIndex];

    const post = await this.generateJobPost({
      categorySlug: category.slug,
      language: 'POLISH',
    });

    const email = `fake_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
    const fakeUser = await this.prisma.user.create({
      data: {
        email,
        password: 'FAKE.',
        accountType: AccountType.CLIENT,
        language: JobLanguage.POLISH,
      },
    });

    const now = new Date();
    const deadline = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const job = await this.prisma.job.create({
      data: {
        title: post.job.title,
        description: post.job.description,
        categoryId: category.id,
        authorId: fakeUser.id,
        status: JobStatus.PUBLISHED,
        language: JobLanguage.POLISH,
        billingType: BillingType.FIXED,
        hoursPerWeek: null,
        rate: 1000,
        rateNegotiable: false,
        currency: 'PLN',
        experienceLevel: ExperienceLevel.MID,
        locationId: null,
        isRemote: true,
        projectType: ProjectType.ONE_TIME,
        deadline,
      },
    });

    this.logger.log(`AI jobs generator: created job ${job.id} in category ${category.slug} for fake user ${fakeUser.email}`);
    return { jobId: job.id, categorySlug: category.slug };
  }

  /**
   * Cron job that automatically generates AI job posts at scheduled times.
   * Runs at 9:00, 13:00, and 17:00 every day.
   */
  @Cron('0 9,13,17 * * *')
  async scheduledGenerateAiJobPost(): Promise<void> {
    await this.generateAiJobPostForRandomCategory();
  }
}

