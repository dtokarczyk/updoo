import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtUser } from './auth.types';

export type { JwtUser } from './auth.types';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
