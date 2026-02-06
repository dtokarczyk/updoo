import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType, BillingType, ExperienceLevel, JobLanguage, JobStatus, ProjectType } from '@prisma/client';
import { BENCHMARK_EXAMPLES } from './examples';
import { fakerPL as faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

export type SupportedLanguage = 'POLISH' | 'ENGLISH';

/** Allowed values for AI-generated job metadata (used for validation and random offerDays). */
const ALLOWED = {
  billingType: Object.values(BillingType),
  experienceLevel: Object.values(ExperienceLevel),
  projectType: Object.values(ProjectType),
  offerDays: [7, 14, 21, 30] as const,
} as const;

export interface GeneratedJobFormData {
  user: {
    email: string;
    name: string;
    surname: string;
  };
  job: {
    title: string;
    description: string;
    categoryId: string;
    billingType: BillingType;
    rate: number;
    currency: string;
    experienceLevel: ExperienceLevel;
    isRemote: boolean;
    projectType: ProjectType;
    language?: JobLanguage;
    offerDays?: number;
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
   * Call AI to generate job metadata (billing, rate, experience, category, etc.) from title + description.
   */
  private async generateJobMetadata(params: {
    title: string;
    description: string;
    categorySlugs: string;
  }): Promise<{
    billingType: BillingType;
    rate: number;
    currency: string;
    experienceLevel: ExperienceLevel;
    isRemote: boolean;
    projectType: ProjectType;
    language: JobLanguage;
    offerDays: number;
    categorySlug: string;
  }> {
    const allowedCategorySlugs = params.categorySlugs.split(', ').map((s) => s.trim()).filter(Boolean);

    const prompt = [
      `Na podstawie poniższego tytułu i opisu oferty pracy wywnioskuj najbardziej prawdopodobne metadane.`,
      `Tytuł: ${params.title}`,
      `Opis (fragment): ${params.description.slice(0, 1500)}`,
      `Dostępne kategorie (wybierz dokładnie jeden slug najlepiej pasujący do opisu oferty): ${params.categorySlugs}`,
      `Zwróć tylko poprawne wartości enum, realistyczną stawkę w PLN (typowa dla polskiego rynku, np. 1000–5000 dla FIXED, 50–200 dla HOURLY) oraz categorySlug z podanej listy.`,
    ].join('\n');

    const raw = await this.aiService.generateText({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['billingType', 'rate', 'experienceLevel', 'projectType', 'categorySlug'],
          properties: {
            billingType: {
              type: 'string',
              enum: ALLOWED.billingType,
              description: 'FIXED lub HOURLY',
            },
            rate: {
              type: 'number',
              description: 'Stawka/budżet w PLN (np. 1000–5000 fixed, 50–200 hourly)',
            },
            experienceLevel: {
              type: 'string',
              enum: ALLOWED.experienceLevel,
              description: 'JUNIOR, MID lub SENIOR',
            },
            projectType: {
              type: 'string',
              enum: ALLOWED.projectType,
              description: 'ONE_TIME lub CONTINUOUS',
            },
            categorySlug: {
              type: 'string',
              enum: allowedCategorySlugs,
              description: 'Slug kategorii najlepiej pasującej do opisu oferty (jedna z podanej listy)',
            },
          },
        },
      },
    });

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const billingType = ALLOWED.billingType.includes(parsed.billingType as BillingType)
      ? (parsed.billingType as BillingType)
      : BillingType.FIXED;
    const rate = typeof parsed.rate === 'number' && parsed.rate > 0 ? Math.round(parsed.rate) : 1000;
    const experienceLevel = ALLOWED.experienceLevel.includes(parsed.experienceLevel as ExperienceLevel)
      ? (parsed.experienceLevel as ExperienceLevel)
      : ExperienceLevel.MID;
    const projectType = ALLOWED.projectType.includes(parsed.projectType as ProjectType)
      ? (parsed.projectType as ProjectType)
      : ProjectType.ONE_TIME;

    const offerDays = ALLOWED.offerDays[Math.floor(Math.random() * ALLOWED.offerDays.length)];

    const categorySlug =
      typeof parsed.categorySlug === 'string' && allowedCategorySlugs.includes(parsed.categorySlug.trim())
        ? parsed.categorySlug.trim()
        : allowedCategorySlugs[0];

    return {
      billingType,
      rate,
      currency: 'PLN',
      experienceLevel,
      isRemote: true,
      projectType,
      language: JobLanguage.POLISH,
      offerDays,
      categorySlug,
    };
  }

  /**
   * Get a random benchmark text from scrapper/output folder
   */
  private getRandomBenchmark(): string {
    try {
      const scrapperOutputPath = path.join(process.cwd(), '..', 'scrapper', 'output');
      const files = fs.readdirSync(scrapperOutputPath).filter(file => file.endsWith('.txt'));

      if (files.length === 0) {
        this.logger.warn('No benchmark files found in scrapper/output folder');
        return BENCHMARK_EXAMPLES[0] || 'No benchmark available';
      }

      const randomFile = files[Math.floor(Math.random() * files.length)];
      const filePath = path.join(scrapperOutputPath, randomFile);
      const content = fs.readFileSync(filePath, 'utf-8');

      return content.trim();
    } catch (error) {
      this.logger.error(`Error reading random benchmark file: ${error.message}`);
      return BENCHMARK_EXAMPLES[0] || 'No benchmark available';
    }
  }

  /**
   * Generate a complete job form draft (user + job data) for a given category slug.
   * Uses Gemini structured output so that the response is directly mappable to the job creation form.
   */
  async generateJobPost(params: {
    language?: SupportedLanguage;
  }): Promise<GeneratedJobFormData> {
    const language = params.language ?? 'POLISH';
    const languageLabel = language === 'ENGLISH' ? 'English' : 'Polish';
    const randomBenchmark = this.getRandomBenchmark();

    const categories = await this.prisma.category.findMany();

    const prompt = [
      `Pisz w języku: ${languageLabel}.`,
      `Przeredaguj poniższą treść minimalnie, zachowując tę samą strukturę, sens, styl ogłoszeniowy i zakres zlecenia, a jedynie lekko dostosuj słownictwo; nie dodawaj nowych informacji, nie rozbudowuj opisu i nie twórz nowej treści.`,
      `Opis oferty (pole description) może być podzielony na akapity: oddzielaj każdy logiczny fragment (np. wprowadzenie, wymagania, zakres prac) podwójną nową linią (\\n\\n). Nie zwracaj jednego długiego akapitu. Gdy potrzebne są wypunktowania, używaj wyłącznie znaku '-' na początku linii. Gdy nie potrzeba wypunktowań, nie dodawaj żadnych znaków.`,
      `Pisz czasami z malej litery. Czasami nie dawaj przecinkow tam gdzie powinny byc.`,
      `Oferta do przerobienia: ${randomBenchmark.replace(/\s+/g, ' ').trim()}`,
    ].join('\n');

    const raw = await this.aiService.generateText({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['job'],
          properties: {
            job: {
              type: 'object',
              description:
                'Dane oferty pracy wygenerowanej na podstawie benchmarku. Tylko title i description - reszta uzupełniana na sztywno.',
              additionalProperties: false,
              required: ['title', 'description'],
              properties: {
                title: {
                  type: 'string',
                  description:
                    'Tytuł oferty pracy. Musi być bardzo zbliżony do tytułu z benchmarku - zachowaj konkretność, specyficzne terminy techniczne, styl i długość.',
                },
                description: {
                  type: 'string',
                  description:
                    'Opis oferty pracy. Zachowaj strukturę, sekcje i styl benchmarku. Przeredaguj tylko minimalnie słownictwo. WYMAGANE: jeśli to możliwe podziel tekst na akapity – każdy logiczny fragment (np. wprowadzenie, wymagania, zakres) oddziel podwójną nową linią (\\n\\n). Minimum 2–3 akapity. Wypunktowania formatuj od znaku "-" (np. "- wymaganie").',
                },
              },
            },
          },
        },
      },
    });

    try {
      const parsed = JSON.parse(raw) as { job?: { title?: string; description?: string } } | null;
      const job = parsed?.job ?? {};
      // Normalize all Unicode dash/hyphen variants to ASCII hyphen
      const normalizeDashes = (s: string) => s.replace(/\p{Pd}/gu, '-');
      const title = job.title ? normalizeDashes(job.title) : undefined;
      const description = job.description ? normalizeDashes(job.description) : undefined;

      if (!title || !description) {
        throw new Error('Missing title or description in AI response JSON.');
      }

      if (categories.length === 0) {
        throw new Error('No categories in database.');
      }

      const categorySlugs = categories.map((c) => c.slug).join(', ');
      const metadata = await this.generateJobMetadata({ title, description, categorySlugs });

      const category =
        categories.find((c) => c.slug === metadata.categorySlug) ?? categories[0];

      const safeUser: GeneratedJobFormData['user'] = {
        email: faker.internet.email(),
        name: faker.person.firstName(),
        surname: faker.person.lastName(),
      };

      const safeJob: GeneratedJobFormData['job'] = {
        title,
        description,
        categoryId: category.id,
        billingType: metadata.billingType,
        rate: metadata.rate,
        currency: metadata.currency,
        experienceLevel: metadata.experienceLevel,
        isRemote: metadata.isRemote,
        projectType: metadata.projectType,
        language: metadata.language,
        offerDays: metadata.offerDays,
      };

      return {
        user: safeUser,
        job: safeJob,
      };
    } catch (error) {
      this.logger.error('Failed to parse structured job post JSON', error as Error);
      throw new Error('Failed to parse structured job post JSON.');
    }
  }

  /**
   * Generate job data, create a new user from generated safeUser, and persist the job (author = new user).
   * Returns the created job with category and author.
   */
  async generateAndCreateJob(): Promise<{ id: string; title: string; description: string; categoryId: string; status: JobStatus }> {
    const generated = await this.generateJobPost({ language: 'POLISH' });
    const { user: safeUser, job } = generated;

    const hashedPassword = await bcrypt.hash(faker.internet.password({ length: 12 }), 10);
    const newUser = await this.prisma.user.create({
      data: {
        email: safeUser.email.toLowerCase(),
        password: hashedPassword,
        name: safeUser.name,
        surname: safeUser.surname,
        accountType: AccountType.CLIENT,
      },
    });

    const now = new Date();
    const allowedDays = [7, 14, 21, 30];
    const deadline =
      job.offerDays != null && allowedDays.includes(job.offerDays)
        ? new Date(now.getTime() + job.offerDays * 24 * 60 * 60 * 1000)
        : null;

    const created = await this.prisma.job.create({
      data: {
        title: job.title.trim(),
        description: job.description.trim(),
        categoryId: job.categoryId,
        authorId: newUser.id,
        status: JobStatus.DRAFT,
        language: job.language ?? JobLanguage.POLISH,
        billingType: job.billingType,
        hoursPerWeek: null,
        rate: job.rate,
        rateNegotiable: false,
        currency: job.currency.toUpperCase().slice(0, 3),
        experienceLevel: job.experienceLevel,
        locationId: null,
        isRemote: job.isRemote,
        projectType: job.projectType,
        deadline,
      },
    });

    this.logger.log(`Created job ${created.id} (${created.title}) for new user ${newUser.id} (${newUser.email})`);
    return {
      id: created.id,
      title: created.title,
      description: created.description,
      categoryId: created.categoryId,
      status: created.status,
    };
  }
}

