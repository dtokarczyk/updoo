import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Like JwtAuthGuard but does not throw when token is missing or invalid; request.user is set only when JWT is valid. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | null, user: TUser | false): TUser | null {
    if (err || user === false) return null;
    return user ?? null;
  }
}
