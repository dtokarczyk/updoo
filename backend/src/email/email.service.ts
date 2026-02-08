import { Injectable } from '@nestjs/common';
import { MailerService } from '../mailer/mailer.service';
import type { SendEmailDto } from './dto/send-email.dto';

/**
 * Facade over MailerSend that keeps the existing send/sendText/sendHtml API
 * and delegates to MailerService (which logs to mailer_log).
 */
@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) { }

  /**
   * Sends an email via MailerSend (logged in mailer_log).
   */
  async send(dto: SendEmailDto): Promise<{ id: string; threadId?: string }> {
    return this.mailerService.send({
      to: dto.to,
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
      from: dto.from,
      replyTo: dto.replyTo,
      cc: dto.cc,
      bcc: dto.bcc,
    });
  }

  /**
   * Sends a simple text email (convenience wrapper).
   */
  async sendText(
    to: string | string[],
    subject: string,
    text: string,
    options?: { from?: string; replyTo?: string; cc?: string[]; bcc?: string[] },
  ): Promise<{ id: string; threadId?: string }> {
    return this.send({
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      from: options?.from,
      replyTo: options?.replyTo,
      cc: options?.cc,
      bcc: options?.bcc,
    });
  }

  /**
   * Sends an HTML email (convenience wrapper). Optional plain text fallback.
   */
  async sendHtml(
    to: string | string[],
    subject: string,
    html: string,
    options?: {
      text?: string;
      from?: string;
      replyTo?: string;
      cc?: string[];
      bcc?: string[];
    },
  ): Promise<{ id: string; threadId?: string }> {
    return this.send({
      to: Array.isArray(to) ? to : [to],
      subject,
      text: options?.text,
      html,
      from: options?.from,
      replyTo: options?.replyTo,
      cc: options?.cc,
      bcc: options?.bcc,
    });
  }

  /**
   * Returns true if MailerSend is configured (API key + from email present).
   */
  isConfigured(): boolean {
    return this.mailerService.isConfigured();
  }
}
