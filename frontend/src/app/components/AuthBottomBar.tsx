"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";

export function AuthBottomBar() {
  const { t } = useTranslations();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-background/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden dark:border-zinc-800">
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <p className="flex-1 text-xs text-muted-foreground">
          {t("auth.promoBarText")}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/login">{t("auth.logIn")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">{t("auth.register")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

