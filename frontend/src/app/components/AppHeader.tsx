"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Logotype } from "@/app/components/Logotype";
import { HomeNav } from "@/app/components/HomeNav";
import type { Locale } from "@/lib/i18n";

export function AppHeader({ initialLocale }: { initialLocale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const isListing = pathname.startsWith("/offers/");
  const showBack = !isHome && !isListing;

  return (
    <header className={`bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 ${isListing ? "lg:hidden" : ""}`}>
      <div
        className={`relative mx-auto flex max-w-6xl flex-row items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4`}
      >
        <div className="flex items-center gap-2">
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

        <Logotype className="absolute left-1/2 -translate-x-1/2 shrink-0 items-center" initialLocale={initialLocale} />

        <div className="flex items-center gap-2">
          <HomeNav />
          <ThemeToggle size="icon-lg" />
        </div>
      </div>
    </header>
  );
}
