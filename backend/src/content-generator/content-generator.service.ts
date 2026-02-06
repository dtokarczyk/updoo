import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType, BillingType, ExperienceLevel, JobLanguage, JobStatus, ProjectType } from '@prisma/client';
import { BENCHMARK_EXAMPLES } from './examples';

export type SupportedLanguage = 'POLISH' | 'ENGLISH';

export interface GeneratedJobFormData {
  user: {
    email: string;
    name: string;
    surname: string;
  };
  job: {
    title: string;
    description: string;
    billingType: 'FIXED' | 'HOURLY';
    rate: number;
    currency: string;
    experienceLevel: 'JUNIOR' | 'MID' | 'SENIOR';
    isRemote: boolean;
    projectType: 'ONE_TIME' | 'CONTINUOUS';
    offerDays: number;
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
      `Jesteś asystentem, którego zadaniem jest tworzenie realistycznych ofert pracy freelance w języku ${languageLabel}.`,
      `Wygeneruj jedną, wiarygodną ofertę pracy freelance dla kategorii o identyfikatorze (slug): ”${params.categorySlug}”.`,
      'Cała treść oferty (tytuł, opis, wymagania, budżet, umiejętności itp.) musi być ściśle zgodna z tą kategorią i odpowiadać realiom rynkowym.',
      'Zwróć dane w taki sposób, aby mogły bezpośrednio posłużyć do wypełnienia formularza dodawania oferty pracy oraz podstawowego profilu klienta.',
      `Przykład oferty: ${BENCHMARK_EXAMPLES[Math.floor(Math.random() * BENCHMARK_EXAMPLES.length)]}`
    ].join('\n');



    const raw = await this.aiService.generateText({
      model: 'gemini-flash-latest',
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
                'Szczegóły klienta, który zamieszcza ofertę pracy, używane do wypełnienia formularza profilu użytkownika.',
              additionalProperties: false,
              required: ['email', 'name', 'surname'],
              properties: {
                email: {
                  type: 'string',
                  description: 'Email klienta, który zamieszcza ofertę pracy.',
                },
                name: {
                  type: 'string',
                  description: 'Imię klienta, który zamieszcza ofertę pracy.',
                },
                surname: {
                  type: 'string',
                  description: 'Nazwisko klienta, który zamieszcza ofertę pracy.',
                },
              },
            },
            job: {
              type: 'object',
              description:
                'Pełna oferta pracy, używana do wypełnienia formularza dodawania oferty pracy.',
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
                    'Krótki, zgrabny tytuł oferty pracy (maksymalnie 90 znaków), napisany w żądanym języku. Nie pisz z wielkich liter kadego slowa.',
                },
                description: {
                  type: 'string',
                  description:
                    'Opis oferty pracy, który odpowiada identyfikatorowi kategorii (slug) i językowi. Bez wypunkwowania. Niezbale napisana. Pomiń niektóre fakty. Staraj sie pisać jak najbardziej naturalnie. Popełniaj błędny interpunkcyjne.',
                },
                billingType: {
                  type: 'string',
                  description: 'Typ rozliczenia (FIXED lub HOURLY), zgodny z CreateJobDto.',
                  enum: ['FIXED', 'HOURLY'],
                },
                rate: {
                  type: 'number',
                  description:
                    'Sugerowany budżet lub stawka godzinowa dla oferty pracy. Musi być liczbą nieujemną.',
                  minimum: 0,
                },
                currency: {
                  type: 'string',
                  description:
                    '3-literowy kod waluty (PLN, EUR lub USD), zgodny z scenariuszem (PLN jest preferowany).',
                },
                experienceLevel: {
                  type: 'string',
                  description:
                    'Poziom doświadczenia (JUNIOR, MID lub SENIOR), zgodny z CreateJobDto.',
                  enum: ['JUNIOR', 'MID', 'SENIOR'],
                },
                isRemote: {
                  type: 'boolean',
                  description:
                    'True jeśli praca może być wykonywana całkowicie zdalnie. Wybierz realistyczną wartość dla oferty pracy.',
                },
                projectType: {
                  type: 'string',
                  description:
                    'Typ projektu (ONE_TIME lub CONTINUOUS), zgodny z CreateJobDto.',
                  enum: ['ONE_TIME', 'CONTINUOUS'],
                },
                offerDays: {
                  type: 'integer',
                  description:
                    'Liczba dni na zbieranie ofert. Musi być jedną z 7, 14, 21 lub 30.',
                  enum: [7, 14, 21, 30],
                },
                skills: {
                  type: 'array',
                  description:
                    'Lista 3–10 istotnych nazw umiejętności (tagów), które ściśle odpowiadają tej ofercie pracy i kategorii.',
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

      const safeUser: GeneratedJobFormData['user'] = {
        email: user.email,
        name: user.name,
        surname: user.surname,
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
      throw new Error('Failed to parse structured job post JSON.');
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

    const fakeUser = await this.prisma.user.create({
      data: {
        email: post.user.email,
        name: post.user.name,
        surname: post.user.surname,
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
}

