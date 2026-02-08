/**
 * MailerSend activity/status values from API and webhooks.
 * @see https://developers.mailersend.com/api/v1/webhooks.html#available-events
 */
export type MailerSendStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'opened_unique'
  | 'clicked'
  | 'clicked_unique'
  | 'soft_bounced'
  | 'hard_bounced'
  | 'bounced'
  | 'spam_complaint'
  | 'failed'
  | 'error'
  | 'deferred'
  | 'unsubscribed';

/**
 * Input for sending an email (no dependency on email module).
 */
export interface SendEmailInput {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * MailerSend webhook payload (activity events).
 * @see https://developers.mailersend.com/api/v1/webhooks.html#payload-example
 */
export interface MailerSendWebhookBody {
  type: string;
  created_at?: string;
  data: {
    id?: string;
    domain_id?: string;
    message_id?: string;
    email_id?: string;
    type?: string;
    subject?: string;
    email?: string;
    tags?: string[];
    meta?: unknown;
  };
}

export interface HandleWebhookArgs {
  body: MailerSendWebhookBody;
  rawBody: Buffer;
  headers: Record<string, string | string[] | undefined>;
}
