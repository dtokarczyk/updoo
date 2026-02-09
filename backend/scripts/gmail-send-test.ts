/**
 * Test script: send one email via MailerSend using credentials from .env
 *
 * Usage (from backend directory):
 *   npm run script:gmail-send-test
 *   npm run script:gmail-send-test -- recipient@example.com
 *
 * Or set TEST_EMAIL_TO in .env to always send to that address.
 *
 * Requires in .env: MAILERSEND_API_KEY, MAILERSEND_FROM_EMAIL.
 * Optional: MAILERSEND_FROM_NAME (sender name), TEST_EMAIL_TO (default recipient).
 */
import 'dotenv/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

async function main(): Promise<void> {
  const apiKey = process.env.MAILERSEND_API_KEY?.trim();
  const fromEmail = process.env.MAILERSEND_FROM_EMAIL?.trim();
  const fromName = process.env.MAILERSEND_FROM_NAME?.trim() || 'Hoplo';
  const to =
    process.argv[2]?.trim() ||
    process.env.TEST_EMAIL_TO?.trim();

  if (!apiKey || !fromEmail) {
    console.error(
      'Missing MAILERSEND_API_KEY or MAILERSEND_FROM_EMAIL in .env',
    );
    process.exit(1);
  }
  if (!to) {
    console.error(
      'Provide recipient: npm run script:gmail-send-test -- your@email.com  or set TEST_EMAIL_TO in .env',
    );
    process.exit(1);
  }

  const subject = 'Test wiadomość – MailerSend (Hoplo)';
  const text =
    'To jest testowa wiadomość wysłana przez skrypt gmail-send-test.\n\nJeśli ją widzisz, integracja z MailerSend działa poprawnie.';
  const html = `<p>${text.replace(/\n/g, '</p><p>')}</p>`;

  const mailerSend = new MailerSend({ apiKey });
  const sender = new Sender(fromEmail, fromName);
  const recipients = [new Recipient(to)];
  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo(recipients)
    .setSubject(subject)
    .setHtml(html)
    .setText(text);

  try {
    const response = await mailerSend.email.send(emailParams);
    const messageId = response.headers['x-message-id'];
    console.log('Email sent successfully.');
    console.log('Message ID:', messageId);
    console.log('To:', to);
  } catch (err) {
    console.error('Failed to send email:', err);
    process.exit(1);
  }
}

main();
