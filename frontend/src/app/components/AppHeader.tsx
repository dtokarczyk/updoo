"use client";

import Link from "next/link";
import { HomeNav } from "@/app/components/HomeNav";

export function AppHeader() {
  return (
    <header className="bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-foreground hover:underline focus:outline-none focus:underline"
        >
          Updoo
        </Link>
        <HomeNav />
      </div>
    </header>
  );
}
