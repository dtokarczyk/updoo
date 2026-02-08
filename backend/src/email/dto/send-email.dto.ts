import { IsEmail, IsOptional, IsString, IsArray, MinLength } from 'class-validator';

/**
 * DTO for sending an email via Gmail API.
 * Use either text or html (or both; multipart will be built).
 */
export class SendEmailDto {
  /** Recipient email address(es) */
  @IsArray()
  @IsEmail({}, { each: true })
  to!: string[];

  /** Email subject */
  @IsString()
  @MinLength(1)
  subject!: string;

  /** Plain text body (optional if html is provided) */
  @IsOptional()
  @IsString()
  text?: string;

  /** HTML body (optional if text is provided) */
  @IsOptional()
  @IsString()
  html?: string;

  /** Sender display (e.g. "Name <email@example.com>"). Overrides default from env. */
  @IsOptional()
  @IsString()
  from?: string;

  /** Reply-To header */
  @IsOptional()
  @IsString()
  replyTo?: string;

  /** CC recipients */
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  /** BCC recipients */
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];
}
