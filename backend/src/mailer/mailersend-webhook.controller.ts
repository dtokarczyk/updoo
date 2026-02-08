import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { MailerWebhookService } from './mailer-webhook.service';
import { HandleWebhookArgs } from './mailer.types';

@Controller('webhooks/mailersend')
export class MailerSendWebhookController {
  constructor(private readonly webhookService: MailerWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Body() body: HandleWebhookArgs['body'],
    @Headers() headers: HandleWebhookArgs['headers'],
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    await this.webhookService.handleWebhook({
      body,
      rawBody: req.rawBody ?? Buffer.from(JSON.stringify(body)),
      headers,
    });

    return { ok: true };
  }
}
