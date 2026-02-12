import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { AgreementsService } from '../agreements/agreements.service';
import { I18nService, SupportedLanguage } from '../i18n/i18n.service';
import type { UserWithAgreements } from './auth.types';

@Injectable()
export class AgreementsAcceptedGuard implements CanActivate {
  constructor(
    private readonly agreementsService: AgreementsService,
    private readonly i18nService: I18nService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: UserWithAgreements }>();

    const user = request.user;
    if (!user) {
      return true;
    }
    const path = request.path ?? request.url?.split('?')[0] ?? '';
    const method = request.method;
    if (method === 'GET' && path.endsWith('/auth/profile')) {
      return true;
    }
    if (method === 'POST' && path.endsWith('/auth/accept-agreements')) {
      return true;
    }

    const lang: SupportedLanguage = this.i18nService.parseLanguageFromHeader(
      request.headers['accept-language'],
    );

    // User must have explicitly accepted terms and privacy policy (no null)
    if (
      user.acceptedTermsVersion == null ||
      user.acceptedPrivacyPolicyVersion == null
    ) {
      throw new ForbiddenException(
        this.i18nService.translate(
          'errors.acceptTermsAndPrivacyRequired',
          lang,
        ),
      );
    }
    const current = this.agreementsService.getCurrentVersions();
    if (
      current.termsVersion != null &&
      user.acceptedTermsVersion !== current.termsVersion
    ) {
      throw new ForbiddenException(
        this.i18nService.translate('errors.acceptCurrentTermsRequired', lang),
      );
    }
    if (
      current.privacyPolicyVersion != null &&
      user.acceptedPrivacyPolicyVersion !== current.privacyPolicyVersion
    ) {
      throw new ForbiddenException(
        this.i18nService.translate('errors.acceptCurrentPrivacyRequired', lang),
      );
    }
    return true;
  }
}
