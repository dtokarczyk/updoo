import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Header for passing pathname to server components (layouts cannot use usePathname). */
export const X_PATHNAME_HEADER = 'x-pathname';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(X_PATHNAME_HEADER, request.nextUrl.pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
