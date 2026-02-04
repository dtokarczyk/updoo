"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isHomeListing =
    pathname === "/" || pathname.startsWith("/offers/");
  const showBack = !isHomeListing;

  if (isHomeListing) {
    return null;
  }

  return (
    <header className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
      <div className="relative mx-auto flex max-w-6xl flex-row items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex items-center">
          {showBack && (
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Powrót do listy"
              onClick={() => {
                // Try to go back in history to preserve scroll position.
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  // Fallback to default offers list when history is not available.
                  router.push("/offers/all/1");
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 shrink-0 text-xl font-semibold tracking-tight text-foreground hover:underline focus:outline-none focus:underline"
        >
          Updoo
        </Link>

        <div className="flex items-center">
          <ThemeToggle size="icon-lg" />
        </div>
      </div>
    </header>
  );
}
