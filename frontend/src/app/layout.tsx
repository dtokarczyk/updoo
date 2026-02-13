import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeScript } from '@/components/ThemeScript';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/contexts/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BetaBar } from '@/components/BetaBar';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { OnboardingRedirect } from '@/components/OnboardingRedirect';
import { ConditionalAnalytics } from '@/components/ConditionalAnalytics';
import { CookieConsent } from '@/components/ui/cookie-consent';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig } from '@/lib/metadata-config';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Allow zoom for accessibility (WCAG) and better mobile usability / SEO
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).default;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl';
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: meta.title,
      template: meta.template,
    },
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      siteName: meta.title,
      images: [
        {
          url: '/og-fallback.png',
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromRequest();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Hoplo" />
      </head>

      <body className={`${geistMono.variable} antialiased`}>
        <ConditionalAnalytics />
        <CookieConsent />
        <ThemeScript />
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <AuthProvider>
              <div className="flex min-h-screen flex-col font-sans w-full">
                <BetaBar initialLocale={locale} />
                <AppHeader />
                <main className="flex-1 w-full pb-20 lg:pb-0">
                  <OnboardingRedirect>{children}</OnboardingRedirect>
                </main>
                <AppFooter initialLocale={locale} />
              </div>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
