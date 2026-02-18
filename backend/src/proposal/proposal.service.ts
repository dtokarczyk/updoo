import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { EmailTemplatesService } from '../email-templates/email-templates.service';
import { AgreementsService } from '../agreements/agreements.service';
import { JobsService } from '../jobs/jobs.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import {
  ProposalReason,
  ProposalStatus,
  AccountType,
  JobLanguage,
} from '@prisma/client';
import type { CreateJobDto } from '../jobs/dto/create-job.dto';

const TOKEN_BYTES = 32;
const SALT_ROUNDS = 10;

@Injectable()
export class ProposalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly agreementsService: AgreementsService,
    private readonly jobsService: JobsService,
  ) {}

  async create(
    dto: CreateProposalDto,
    lang: 'pl' | 'en' = 'pl',
  ): Promise<{ id: string; token: string }> {
    const { email, reason, ...jobData } = dto;
    const emailLower = email.trim().toLowerCase();
    const token = randomBytes(TOKEN_BYTES).toString('hex');

    const proposal = await this.prisma.proposal.create({
      data: {
        jobData: jobData as object,
        email: emailLower,
        reason: reason as ProposalReason,
        token,
        status: ProposalStatus.PENDING,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const acceptUrl = `${frontendUrl}/invitation?token=${encodeURIComponent(token)}`;
    const rejectUrl = `${frontendUrl}/invitation?token=${encodeURIComponent(token)}&reject=1`;
    const offerTitle = (dto.title ?? '').trim() || (lang === 'pl' ? 'Oferta' : 'Job');

    const { subject, html } = this.emailTemplates.render(
      'proposal-invitation',
      lang,
      { acceptUrl, rejectUrl, offerTitle },
    );

    if (this.emailService.isConfigured()) {
      await this.emailService.sendHtml(emailLower, subject, html);
    }

    return { id: proposal.id, token: proposal.token };
  }

  async getByToken(token: string): Promise<{
    email: string;
    reason: string;
    status: string;
    title: string;
  } | null> {
    const proposal = await this.prisma.proposal.findUnique({
      where: { token },
    });
    if (!proposal) return null;
    const jobData = proposal.jobData as Record<string, unknown>;
    const title =
      (typeof jobData?.title === 'string' ? jobData.title : '') || 'Oferta';
    return {
      email: proposal.email,
      reason: proposal.reason,
      status: proposal.status,
      title,
    };
  }

  async accept(token: string, lang: 'pl' | 'en' = 'pl'): Promise<{ message: string }> {
    const proposal = await this.prisma.proposal.findUnique({
      where: { token },
    });
    if (!proposal) {
      throw new NotFoundException('Invalid or expired link');
    }
    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('This link has already been used');
    }

    const emailLower = proposal.email.trim().toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (user) {
      if (user.accountType !== AccountType.CLIENT) {
        throw new ConflictException(
          'A user with this email already exists with a different account type. Please contact support.',
        );
      }
    } else {
      const plainPassword = randomBytes(16).toString('hex');
      const { termsVersion, privacyPolicyVersion } =
        this.agreementsService.getCurrentVersions();
      const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
      user = await this.prisma.user.create({
        data: {
          email: emailLower,
          password: hashedPassword,
          accountType: AccountType.CLIENT,
          acceptedTermsVersion: termsVersion ?? undefined,
          acceptedPrivacyPolicyVersion: privacyPolicyVersion ?? undefined,
        },
      });

      const loginUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      const creds = this.emailTemplates.render('proposal-credentials', lang, {
        email: emailLower,
        password: plainPassword,
        loginUrl: `${loginUrl}/login`,
      });
      if (this.emailService.isConfigured()) {
        await this.emailService.sendHtml(
          emailLower,
          creds.subject,
          creds.html,
          creds.text ? { text: creds.text } : undefined,
        );
      }

      const welcome = this.emailTemplates.render('welcome', lang, {
        greeting: lang === 'pl' ? 'Witaj!' : 'Hello!',
        loginUrl: `${loginUrl}/login`,
      });
      if (this.emailService.isConfigured()) {
        await this.emailService.sendHtml(
          emailLower,
          welcome.subject,
          welcome.html,
          welcome.text ? { text: welcome.text } : undefined,
        );
        await this.prisma.user.update({
          where: { id: user.id },
          data: { welcomeEmailSentAt: new Date() },
        });
      }
    }

    const jobData = proposal.jobData as unknown as CreateJobDto;
    const job = await this.jobsService.createJob(
      user.id,
      'CLIENT',
      jobData,
      JobLanguage.POLISH,
    );
    if (!job) {
      throw new BadRequestException('Failed to create job from proposal');
    }

    await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: ProposalStatus.ACCEPTED,
        respondedAt: new Date(),
        jobId: job.id,
      },
    });

    const message =
      lang === 'pl'
        ? 'Konto utworzone. Wysłaliśmy na Twój adres e-mail dane logowania – zaloguj się i zmień hasło.'
        : 'Account created. We have sent login details to your email – log in and change your password.';
    return { message };
  }

  async reject(token: string, _lang: 'pl' | 'en' = 'pl'): Promise<{ message: string }> {
    const proposal = await this.prisma.proposal.findUnique({
      where: { token },
    });
    if (!proposal) {
      throw new NotFoundException('Invalid or expired link');
    }
    if (proposal.status !== ProposalStatus.PENDING) {
      return {
        message: _lang === 'pl' ? 'Dziękujemy za odpowiedź.' : 'Thank you for your response.',
      };
    }

    await this.prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: ProposalStatus.REJECTED,
        respondedAt: new Date(),
      },
    });

    return {
      message: _lang === 'pl' ? 'Dziękujemy za odpowiedź.' : 'Thank you for your response.',
    };
  }

  async list(
    limit: number,
    offset: number,
  ): Promise<{
    items: Array<{
      id: string;
      email: string;
      reason: string;
      status: string;
      title: string;
      jobId: string | null;
      respondedAt: string | null;
      createdAt: string;
    }>;
    total: number;
  }> {
    const [items, total] = await Promise.all([
      this.prisma.proposal.findMany({
        take: Math.min(limit, 100),
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.proposal.count(),
    ]);

    return {
      items: items.map((p) => {
        const jobData = p.jobData as Record<string, unknown>;
        const title =
          (typeof jobData?.title === 'string' ? jobData.title : '') || 'Oferta';
        return {
          id: p.id,
          email: p.email,
          reason: p.reason,
          status: p.status,
          title,
          jobId: p.jobId,
          respondedAt: p.respondedAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
        };
      }),
      total,
    };
  }

  async stats(): Promise<{
    pending: number;
    accepted: number;
    rejected: number;
  }> {
    const [pending, accepted, rejected] = await Promise.all([
      this.prisma.proposal.count({ where: { status: ProposalStatus.PENDING } }),
      this.prisma.proposal.count({ where: { status: ProposalStatus.ACCEPTED } }),
      this.prisma.proposal.count({ where: { status: ProposalStatus.REJECTED } }),
    ]);
    return { pending, accepted, rejected };
  }
}
