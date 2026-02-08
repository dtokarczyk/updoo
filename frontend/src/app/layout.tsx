import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeScript } from '@/app/components/ThemeScript';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/contexts/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BetaBar } from '@/app/components/BetaBar';
import { AppHeader } from '@/app/components/AppHeader';
import { AppFooter } from '@/app/components/AppFooter';
import { OnboardingRedirect } from '@/app/components/OnboardingRedirect';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig } from '@/lib/metadata-config';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).default;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oferi.pl';
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
    <html
      lang={locale}
      suppressHydrationWarning
      className="w-full overflow-x-hidden lg:overflow-x-visible"
    >
      <body
        className={`${geistMono.variable} antialiased w-full overflow-x-hidden lg:overflow-x-visible`}
      >
        <ThemeScript />
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            <AuthProvider>
              <div className="flex min-h-screen flex-col font-sans w-full lg:overflow-x-visible">
                <BetaBar initialLocale={locale} />
                <AppHeader initialLocale={locale} />
                <main className="flex-1 w-full overflow-x-hidden lg:overflow-x-visible">
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
