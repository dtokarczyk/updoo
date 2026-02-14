import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { FAKE_PASSWORD } from '../mailer/constants';
import type { JwtUser } from '../auth/auth.types';

export interface AdminStatsDto {
  registeredUsersLast7Days: number;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Returns dashboard stats for the admin panel (e.g. real users registered in last 7 days).
   */
  async getStats(): Promise<AdminStatsDto> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const registeredUsersLast7Days = await this.prisma.user.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        OR: [{ password: null }, { password: { not: FAKE_PASSWORD } }],
      },
    });

    return { registeredUsersLast7Days };
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
