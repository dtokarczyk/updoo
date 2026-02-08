import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { MailerSend, Recipient, EmailParams, Sender } from 'mailersend';
import { MailerLogService } from '../mailer-log/mailer-log.service';
import { MailerLogStatus } from '@prisma/client';
import { MailerSendStatus, SendEmailInput } from './mailer.types';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly mailerLogService: MailerLogService) {
    this.apiKey = process.env.MAILERSEND_API_KEY?.trim() ?? '';
    this.fromEmail = process.env.MAILERSEND_FROM_EMAIL?.trim() ?? '';
    this.fromName = process.env.MAILERSEND_FROM_NAME?.trim() ?? 'Oferi';

    if (!this.apiKey) {
      this.logger.warn(
        'MAILERSEND_API_KEY not set. Email sending will be disabled.',
      );
    }
    if (!this.fromEmail && this.apiKey) {
      this.logger.warn(
        'MAILERSEND_FROM_EMAIL not set. Set it for valid sender address.',
      );
    }
  }

  /**
   * Sends an email via MailerSend and logs it (one log per first recipient for simplicity).
   */
  async send(dto: SendEmailInput): Promise<{ id: string; threadId?: string }> {
    const toList = Array.isArray(dto.to) ? dto.to : [dto.to];
    if (toList.length === 0) {
      throw new InternalServerErrorException('At least one recipient required.');
    }

    const content =
      dto.html ?? dto.text ?? '';
    const subject = dto.subject;
    const firstTo = toList[0];

    const mailerLog = await this.mailerLogService.create({
      recipientEmail: firstTo,
      subject,
      content,
      status: MailerLogStatus.QUEUED,
    });

    try {
      if (!this.isConfigured()) {
        this.logger.warn(
          'MailerSend not configured - simulating success (email not sent)',
        );
        const simulatedId = `disabled-${Date.now()}`;
        await this.mailerLogService.update(mailerLog.id, {
          status: MailerLogStatus.SENT,
          messageId: simulatedId,
          sentAt: new Date(),
        });
        return { id: simulatedId };
      }

      const mailerSend = new MailerSend({ apiKey: this.apiKey });
      const from = this.parseFrom(dto.from);
      const sender = new Sender(from.email, from.name);
      const recipients = toList.map((email) => new Recipient(email));
      const emailParams = new EmailParams()
        .setFrom(sender)
        .setTo(recipients)
        .setSubject(subject)
        .setHtml(dto.html ?? this.textToHtml(dto.text ?? ''))
        .setText(dto.text ?? (dto.html ? stripHtml(dto.html) : ''));

      if (dto.replyTo) {
        emailParams.setReplyTo(new Sender(dto.replyTo, ''));
      }
      if (dto.cc?.length) {
        emailParams.setCc(dto.cc.map((e) => new Recipient(e)));
      }
      if (dto.bcc?.length) {
        emailParams.setBcc(dto.bcc.map((e) => new Recipient(e)));
      }

      const response = await mailerSend.email.send(emailParams);
      const messageId = String(response.headers['x-message-id'] ?? '');

      await this.mailerLogService.update(mailerLog.id, {
        status: MailerLogStatus.SENT,
        messageId: messageId || undefined,
        sentAt: new Date(),
        errorMessage: null,
      });

      this.logger.log(`Email sent successfully, messageId=${messageId}`);
      return { id: messageId };
    } catch (error) {
      this.logger.error('Failed to send email', error as Error);
      const errMessage = buildErrorMessage(error);
      await this.mailerLogService.update(mailerLog.id, {
        status: MailerLogStatus.FAILED,
        errorMessage: errMessage,
      });
      throw new InternalServerErrorException(
        'Failed to send email via MailerSend.',
      );
    }
  }

  mapMailerSendStatusToMailerLogStatus(
    status: MailerSendStatus,
  ): MailerLogStatus {
    switch (status) {
      case 'queued':
      case 'deferred':
        return MailerLogStatus.QUEUED;
      case 'sent':
        return MailerLogStatus.SENT;
      case 'delivered':
        return MailerLogStatus.DELIVERED;
      case 'opened':
      case 'opened_unique':
        return MailerLogStatus.OPENED;
      case 'clicked':
      case 'clicked_unique':
        return MailerLogStatus.CLICKED;
      case 'soft_bounced':
      case 'hard_bounced':
      case 'bounced':
        return MailerLogStatus.BOUNCED;
      case 'spam_complaint':
        return MailerLogStatus.SPAM_COMPLAINT;
      case 'failed':
      case 'error':
        return MailerLogStatus.FAILED;
      case 'unsubscribed':
        return MailerLogStatus.PENDING;
      default:
        return MailerLogStatus.PENDING;
    }
  }

  textToHtml(text: string): string {
    return text
      .split('\n')
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join('');
  }

  private parseFrom(from?: string): { email: string; name: string } {
    const defaultEmail = this.fromEmail || 'noreply@localhost';
    const defaultName = this.fromName || 'Oferi';
    if (!from?.trim()) {
      return { email: defaultEmail, name: defaultName };
    }
    const match = from.match(/^(.+?)\s*<([^>]+)>$/);
    if (match) {
      return { email: match[2].trim(), name: match[1].trim() };
    }
    return { email: from.trim(), name: defaultName };
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.fromEmail);
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildErrorMessage(error: unknown): string {
  const base = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error && error.stack ? `\n${error.stack}` : '';
  const errAny = error as { response?: { status?: number; body?: unknown; text?: string } };
  const status = errAny?.response?.status;
  const body = errAny?.response?.body ?? errAny?.response?.text;
  const extra =
    status !== undefined || body !== undefined
      ? `\nResponse: status=${status}, body=${typeof body === 'string' ? body : JSON.stringify(body)}`
      : '';
  return `${base}${stack}${extra}`.slice(0, 15000);
}
