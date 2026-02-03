"use client";

import Link from "next/link";
import { HomeNav } from "@/app/components/HomeNav";

export function AppHeader() {
  return (
    <header className="bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-4xl flex-row items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6 lg:min-h-14 lg:py-3 lg:gap-8">
        <Link
          href="/"
          className="shrink-0 text-xl font-semibold tracking-tight text-foreground hover:underline focus:outline-none focus:underline lg:hidden"
        >
          Updoo
        </Link>
        <div className="hidden shrink-0 lg:block lg:w-52" aria-hidden />
        <div className="min-w-0 shrink">
          <HomeNav />
        </div>
      </div>
    </header>
  );
}
