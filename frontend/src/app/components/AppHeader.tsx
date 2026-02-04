"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppHeader() {
  return (
    <header className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 lg:hidden">
      <div className="mx-auto flex max-w-6xl flex-row items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="shrink-0 text-xl font-semibold tracking-tight text-foreground hover:underline focus:outline-none focus:underline"
        >
          Updoo
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
