import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { AgreementsService } from '../agreements/agreements.service';

/** User attached by JwtStrategy has acceptedTermsVersion and acceptedPrivacyPolicyVersion. */
interface UserWithAgreements {
  acceptedTermsVersion?: string | null;
  acceptedPrivacyPolicyVersion?: string | null;
}

@Injectable()
export class AgreementsAcceptedGuard implements CanActivate {
  constructor(private readonly agreementsService: AgreementsService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: UserWithAgreements }>();
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
    const current = this.agreementsService.getCurrentVersions();
    if (
      current.termsVersion != null &&
      user.acceptedTermsVersion !== current.termsVersion
    ) {
      throw new ForbiddenException(
        'You must accept the current terms of service to use this service.',
      );
    }
    if (
      current.privacyPolicyVersion != null &&
      user.acceptedPrivacyPolicyVersion !== current.privacyPolicyVersion
    ) {
      throw new ForbiddenException(
        'You must accept the current privacy policy to use this service.',
      );
    }
    return true;
  }
}
