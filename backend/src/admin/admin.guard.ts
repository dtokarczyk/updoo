import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import type { JwtUser } from '../auth/auth.types';

/**
 * Guard that allows only users with accountType === 'ADMIN'.
 * Must be used after JwtAuthGuard so request.user is set.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>();
    const user = request.user;
    if (!user || user.accountType !== 'ADMIN') {
      throw new ForbiddenException('Only admin users can access this resource');
    }
    return true;
  }
}
