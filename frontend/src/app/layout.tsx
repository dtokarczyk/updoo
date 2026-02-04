import React from "react";
import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/app/components/ThemeScript";
import { ThemeProvider } from "@/lib/theme";
import { AppHeader } from "@/app/components/AppHeader";
import { AppFooter } from "@/app/components/AppFooter";
import { getLocaleFromRequest } from "@/lib/i18n";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromRequest();

  return (
    <html lang={locale} suppressHydrationWarning className="w-full overflow-x-hidden">
      <body
        className={`${geistMono.variable} antialiased w-full overflow-x-hidden`}
      >
        <ThemeScript />
        <ThemeProvider>
          <div className="flex min-h-screen flex-col font-sans w-full overflow-x-hidden">
            <AppHeader initialLocale={locale} />
            <main className="flex-1 w-full overflow-x-hidden">{children}</main>
            <AppFooter initialLocale={locale} />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
