import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import type { JwtUser } from '../auth/auth.types';

@Injectable()
export class AdminService {
  constructor(private readonly emailService: EmailService) {}

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
