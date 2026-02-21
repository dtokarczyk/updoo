import { Injectable } from '@nestjs/common';
import { ProposalStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { JobsService } from '../jobs/jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { FAKE_PASSWORD } from '../mailer/constants';
import type { JwtUser } from '../auth/auth.types';
import type { AccountType } from '@prisma/client';

export interface AdminStatsDto {
  totalUsers: number;
  registeredUsersLast7Days: number;
  registeredUsersToday: number;
  jobsCreatedByRealUsers: number;
  /** Invitation proposals created in the last 7 days */
  proposalsCreatedLast7Days: number;
  /** Invitation proposals accepted in the last 7 days */
  proposalsAcceptedLast7Days: number;
  /** Invitation proposals rejected in the last 7 days */
  proposalsRejectedLast7Days: number;
  /** Invitation proposals created today */
  proposalsCreatedToday: number;
  /** Invitation proposals accepted today */
  proposalsAcceptedToday: number;
  /** Invitation proposals rejected today */
  proposalsRejectedToday: number;
}

export interface AdminUserListItemDto {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  accountType: AccountType | null;
  createdAt: string;
}

export interface AdminMailerLogItemDto {
  id: string;
  recipientEmail: string;
  subject: string;
  content: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly emailService: EmailService,
    private readonly jobsService: JobsService,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Returns real users only (excludes FAKE auto-generated: password !== FAKE_PASSWORD or null).
   * Sorted by createdAt desc (newest first). For admin panel display only - no editing.
   */
  async getRealUsers(): Promise<AdminUserListItemDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [{ password: null }, { password: { not: FAKE_PASSWORD } }],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        accountType: true,
        createdAt: true,
      },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      surname: u.surname,
      accountType: u.accountType,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  private realUserWhere() {
    return {
      OR: [{ password: null }, { password: { not: FAKE_PASSWORD } }],
    };
  }

  /**
   * Returns dashboard stats for the admin panel (real users only, no FAKE).
   */
  async getStats(): Promise<AdminStatsDto> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      registeredUsersLast7Days,
      registeredUsersToday,
      jobsCreatedByRealUsers,
      proposalsCreatedLast7Days,
      proposalsAcceptedLast7Days,
      proposalsRejectedLast7Days,
      proposalsCreatedToday,
      proposalsAcceptedToday,
      proposalsRejectedToday,
    ] = await Promise.all([
      this.prisma.user.count({
        where: this.realUserWhere(),
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
          ...this.realUserWhere(),
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: startOfToday },
          ...this.realUserWhere(),
        },
      }),
      this.prisma.job.count({
        where: {
          author: this.realUserWhere(),
        },
      }),
      this.prisma.proposal.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.proposal.count({
        where: {
          status: ProposalStatus.ACCEPTED,
          respondedAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.proposal.count({
        where: {
          status: ProposalStatus.REJECTED,
          respondedAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.proposal.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      this.prisma.proposal.count({
        where: {
          status: ProposalStatus.ACCEPTED,
          respondedAt: { gte: startOfToday },
        },
      }),
      this.prisma.proposal.count({
        where: {
          status: ProposalStatus.REJECTED,
          respondedAt: { gte: startOfToday },
        },
      }),
    ]);

    return {
      totalUsers,
      registeredUsersLast7Days,
      registeredUsersToday,
      jobsCreatedByRealUsers,
      proposalsCreatedLast7Days,
      proposalsAcceptedLast7Days,
      proposalsRejectedLast7Days,
      proposalsCreatedToday,
      proposalsAcceptedToday,
      proposalsRejectedToday,
    };
  }

  /**
   * Returns mailer logs for admin panel. Sorted by createdAt desc (newest first).
   */
  async getMailerLogs(limit = 500): Promise<AdminMailerLogItemDto[]> {
    const logs = await this.prisma.mailerLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(1, limit), 500),
      select: {
        id: true,
        recipientEmail: true,
        subject: true,
        content: true,
        status: true,
        sentAt: true,
        createdAt: true,
      },
    });
    return logs.map((l) => ({
      id: l.id,
      recipientEmail: l.recipientEmail,
      subject: l.subject,
      content: l.content,
      status: l.status,
      sentAt: l.sentAt?.toISOString() ?? null,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  /**
   * Sends a test email to the given admin's email address.
   */
  async sendTestEmail(
    user: JwtUser,
  ): Promise<{ ok: boolean; messageId?: string }> {
    const to = user.email;
    const subject = '[Updoo Admin] Test email';
    const text =
      `This is a test email sent from the Updoo admin panel.\n\n` +
      `Sent at: ${new Date().toISOString()}\n` +
      `Recipient: ${to}\n` +
      `If you received this, the email configuration is working correctly.`;

    const result = await this.emailService.sendText(to, subject, text);
    return { ok: true, messageId: result.id };
  }

  /**
   * Regenerate OG image for a job. Delegates to JobsService.
   */
  async regenerateJobOgImage(
    jobId: string,
  ): Promise<{ ok: boolean; url?: string; error?: string }> {
    return this.jobsService.regenerateJobOgImage(jobId);
  }
}
