import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { I18nService } from './i18n.service';
import { I18nExceptionFilter } from './i18n-exception.filter';

@Global()
@Module({
  providers: [
    I18nService,
    {
      provide: APP_FILTER,
      useClass: I18nExceptionFilter,
    },
  ],
  exports: [I18nService],
})
export class I18nModule {}
