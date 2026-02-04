"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";

export function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-0">
          <Link
            href="/"
            className="text-sm font-medium text-foreground hover:underline focus:outline-none focus:underline"
          >
            Updoo
          </Link>
          <div className="flex items-center gap-4">
            <LanguageToggle size="sm" />
            <p className="text-xs text-muted-foreground">
              © {year} Updoo. Wszelkie prawa zastrzeżone.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
