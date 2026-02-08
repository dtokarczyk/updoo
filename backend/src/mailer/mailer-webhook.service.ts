import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { MailerLogService } from '../mailer-log/mailer-log.service';
import { MailerService } from './mailer.service';
import { HandleWebhookArgs, MailerSendStatus } from './mailer.types';

@Injectable()
export class MailerWebhookService {
  private readonly logger = new Logger(MailerWebhookService.name);

  constructor(
    private readonly mailerLogService: MailerLogService,
    private readonly mailerService: MailerService,
  ) {}

  async handleWebhook({
    body,
    rawBody,
    headers,
  }: HandleWebhookArgs): Promise<void> {
    this.logger.debug(`body: ${JSON.stringify(body)}`);
    this.logger.debug(`headers: ${JSON.stringify(headers)}`);

    await this.assertSignature(rawBody, headers);

    await this.updateMailerLog(body);
  }

  private async assertSignature(
    rawBody: Buffer,
    headers: HandleWebhookArgs['headers'],
  ): Promise<void> {
    const secret = process.env.MAILERSEND_WEBHOOK_SECRET?.trim();

    if (!secret) {
      this.logger.error('MAILERSEND_WEBHOOK_SECRET not configured');
      throw new UnauthorizedException(
        'Webhook secret not configured (MAILERSEND_WEBHOOK_SECRET)',
      );
    }

    const signature = headers['signature'];
    if (!signature) {
      this.logger.error('Missing signature header');
      throw new UnauthorizedException('Missing signature header');
    }

    const signatureHeader =
      typeof signature === 'string' ? signature : signature[0];

    // MailerSend: HMAC-SHA256 of raw body, signature sent as hex
    const computed = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    let signatureBuffer: Buffer;
    try {
      signatureBuffer = Buffer.from(signatureHeader, 'hex');
    } catch (error) {
      this.logger.error(`Failed to parse signature as hex: ${error}`);
      throw new UnauthorizedException('Invalid signature format');
    }

    const computedBuffer = Buffer.from(computed, 'hex');

    if (signatureBuffer.length !== computedBuffer.length) {
      this.logger.warn(
        `Signature length mismatch: received=${signatureBuffer.length}, computed=${computedBuffer.length}`,
      );
      throw new UnauthorizedException('Invalid MailerSend signature');
    }

    const valid = timingSafeEqual(signatureBuffer, computedBuffer);

    if (!valid) {
      this.logger.warn('Invalid MailerSend signature');
      throw new UnauthorizedException('Invalid MailerSend signature');
    }
  }

  private async updateMailerLog(
    body: HandleWebhookArgs['body'],
  ): Promise<void> {
    // Prefer data.type (e.g. "sent"); fallback to stripping "activity." from body.type (e.g. "activity.sent" -> "sent")
    const rawType =
      body.data?.type ?? (body.type?.startsWith('activity.')
        ? body.type.replace(/^activity\./, '')
        : body.type);
    const status = this.mailerService.mapMailerSendStatusToMailerLogStatus(
      (rawType ?? '') as MailerSendStatus,
    );
    const messageId = body.data?.message_id;

    if (messageId) {
      const updated = await this.mailerLogService.updateByMessageId(messageId, {
        status,
      });

      if (!updated) {
        this.logger.debug(
          `Webhook update by messageId missed: messageId=${messageId}, status=${status}`,
        );
      } else {
        this.logger.debug(
          `Webhook updated by messageId=${messageId}, id=${updated.id}, status=${status}`,
        );
      }
    }
  }
}
