import { Injectable, ValidationPipe } from '@nestjs/common';

/**
 * Standard ValidationPipe that works with I18nExceptionFilter.
 * The filter will translate validation error messages based on Accept-Language header.
 */
@Injectable()
export class I18nValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  }
}
