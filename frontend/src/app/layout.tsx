import React from "react";
import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/app/components/ThemeScript";
import { ThemeProvider } from "@/lib/theme";
import { AppHeader } from "@/app/components/AppHeader";
import { AppFooter } from "@/app/components/AppFooter";
import { getUserLocale } from "@/lib/i18n";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getUserLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistMono.variable} antialiased`}
      >
        <ThemeScript />
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
            <AppHeader />
            <main className="flex-1">{children}</main>
            <AppFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
