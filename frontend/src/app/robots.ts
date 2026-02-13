import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl';

/**
 * Generates robots.txt for crawlers.
 * Disallows private areas (admin, my account, profile, auth, onboarding).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/my',
          '/profile',
          '/login', // includes /login/forgot-password, /login/reset-password
          '/register',
          '/onboarding',
          '/job/new',
          '/job/*/edit',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
