import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { FAKE_PASSWORD } from '../mailer/constants';
import type { JwtUser } from '../auth/auth.types';
import type { AccountType } from '@prisma/client';

export interface AdminStatsDto {
  totalUsers: number;
  registeredUsersLast7Days: number;
  registeredUsersToday: number;
  jobsCreatedByRealUsers: number;
}

export interface AdminUserListItemDto {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  accountType: AccountType | null;
  createdAt: string;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Returns real users only (excludes FAKE auto-generated: password !== FAKE_PASSWORD or null).
   * Sorted by createdAt desc (newest first). For admin panel display only – no editing.
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

    const [totalUsers, registeredUsersLast7Days, registeredUsersToday, jobsCreatedByRealUsers] =
      await Promise.all([
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
      ]);

    return {
      totalUsers,
      registeredUsersLast7Days,
      registeredUsersToday,
      jobsCreatedByRealUsers,
    };
  }

  /**
   * Sends a test email to the given admin's email address.
   */
  async sendTestEmail(user: JwtUser): Promise<{ ok: boolean; messageId?: string }> {
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
}
